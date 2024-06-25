//! This module provides the [`ComputerVisionSvc`] struct and its associated methods for image processing.
//! 
//! The primary functionality includes handling single and batch image processing requests using gRPC.
//! The [`ComputerVisionSvc`] utilizes an [`ImageProcessor`] to perform the actual processing of images
//! and a semaphore to limit the number of concurrent requests for efficient resource management.
use std::sync::Arc;
use tokio::task::{self, JoinError};
use tokio::sync::{mpsc, Semaphore, OwnedSemaphorePermit};
use tokio_stream::wrappers::ReceiverStream;
use tonic::{Request, Response, Status, Streaming};
use candle_core::{Device, Result as CandleResult};
use crate::image_captioning::ImageProcessor;
use crate::image_captioning::model_loader::Models;
use crate::proto::{ImgProcRequest, ImgProcResponse, ModelType};
use crate::proto::computer_vision_server::ComputerVision;

/// Maximum number of concurrent requests that can be processed.
const MAX_CONCURRENT_REQUESTS: usize = 16;

/// Type alias for a result that returns a gRPC [`Response`] or a [`Status`].
type ResponseResult<T> = Result<Response<T>, Status>;

/// The [`ComputerVisionSvc`] struct provides methods for processing images.
/// It holds an [`ImageProcessor`] instance and a semaphore for limiting concurrent requests.
pub struct ComputerVisionSvc {
    processor: Arc<ImageProcessor>,
    semaphore: Arc<Semaphore>,
}

impl ComputerVisionSvc {
    /// Creates a new instance of [`ComputerVisionSvc`].
    ///
    /// This method initializes the image processor and the semaphore for controlling
    /// the number of concurrent requests.
    ///
    /// # Arguments
    ///
    /// * `models` - A reference to the [`Models`] struct containing the model configurations.
    /// * `device` - The device on which the models will be loaded.
    ///
    /// # Returns
    ///
    /// A [`CandleResult`] containing the new [`ComputerVisionSvc`] instance or an error if
    /// initialization fails.
    pub fn new(models: &Models, device: Device) -> CandleResult<Self> {
        Ok(Self {
            processor: Arc::new(ImageProcessor::new(models, device)?),
            semaphore: Arc::new(Semaphore::new(MAX_CONCURRENT_REQUESTS)),
        })
    }

    /// Validates an [`ImgProcRequest`] to ensure it is well-formed.
    ///
    /// This method checks if the request's image field is not empty and if the model type is valid.
    ///
    /// # Arguments
    ///
    /// * `request` - A reference to the [`ImgProcRequest`] to be validated.
    ///
    /// # Returns
    ///
    /// An `Ok(())` if the request is valid, otherwise an `Err(Status)` describing the problem.
    ///
    /// # Errors
    ///
    /// Returns a [`Status::invalid_argument`] if the image is empty or the model type is invalid.
    fn validate_request(&self, request: &ImgProcRequest) -> Result<(), Status> {
        if request.image.is_empty() {
            return Err(Status::invalid_argument("Empty vector of bytes"));
        }
        ModelType::try_from(request.model)
            .map_err(|_| Status::invalid_argument("Invalid model type"))?;

        Ok(())
    }
}

#[tonic::async_trait]
impl ComputerVision for ComputerVisionSvc {
    /// The stream type for the `process_image_batch` method.
    type ProcessImageBatchStream = ReceiverStream<Result<ImgProcResponse, Status>>;

    /// Processes a single image and returns a description.
    ///
    /// This method handles the processing of a single image request by validating the request,
    /// acquiring a semaphore permit to limit concurrency, and then spawning a blocking task to
    /// perform the actual image processing. The result is then sent back as a gRPC response.
    ///
    /// # Arguments
    ///
    /// * `request` - A gRPC [`Request`] containing the [`ImgProcRequest`].
    ///
    /// # Returns
    ///
    /// A [`ResponseResult`] containing an [`ImgProcResponse`] with the image description or a gRPC
    /// `Status` on error.
    ///
    /// # Errors
    ///
    /// Returns a [`Status::invalid_argument`] if the request is invalid, [`Status::resource_exhausted`]
    /// if too many concurrent requests are being processed, or [`Status::internal`] if an error occurs
    /// during processing.
    async fn process_image(&self, request: Request<ImgProcRequest>) -> ResponseResult<ImgProcResponse> {
        tracing::info!(peer_addr = ?request.remote_addr(), "ProcessImage Invoked");

        self.validate_request(request.get_ref())?;
        let ImgProcRequest { model, image } = request.into_inner();

        // Safely unwrap as validation ensures validity
        let model = ModelType::try_from(model).unwrap();
        let processor: Arc<ImageProcessor> = Arc::clone(&self.processor);
        let semaphore: Arc<Semaphore> = Arc::clone(&self.semaphore);

        let _permit: OwnedSemaphorePermit = semaphore
            .acquire_owned()
            .await
            .map_err(|_| Status::resource_exhausted("Too many concurrent requests"))?;

        let process_result: Result<CandleResult<String>, JoinError> =
            task::spawn_blocking(move || processor.process_image(model, &image)).await;

        drop(_permit);

        match process_result {
            Ok(Ok(description)) => {
                let response = ImgProcResponse { description };
                Ok(Response::new(response))
            }
            Ok(Err(e)) => {
                tracing::error!("Error processing image: {:?}", e);
                Err(Status::internal(format!("Error processing image: {}", e)))
            }
            Err(e) => {
                tracing::error!("Error executing blocking task: {:?}", e);
                Err(Status::internal(format!("Error executing blocking task: {}", e)))
            }
        }
    }

    /// Processes a stream of image requests and returns a stream of responses.
    ///
    /// This method handles the processing of a batch of image requests received as a stream.
    /// It validates each request, acquires a semaphore permit, and spawns a blocking task for each
    /// image processing operation. The responses are sent back as a stream of [`ImgProcResponse`].
    ///
    /// # Arguments
    ///
    /// * `request` - A gRPC [`Request`] containing a [`Streaming<ImgProcRequest>`].
    ///
    /// # Returns
    ///
    /// A [`ResponseResult`] containing a stream of [`ImgProcResponse`] or a gRPC [`Status`] on error.
    ///
    /// # Errors
    ///
    /// Returns a [`Status::resource_exhausted`] if too many concurrent requests are being processed,
    /// or [`Status::internal`] if an error occurs during processing.
    async fn process_image_batch(&self, request: Request<Streaming<ImgProcRequest>>) -> ResponseResult<Self::ProcessImageBatchStream> {
        tracing::info!(peer_addr = ?request.remote_addr(), "ProcessImageBatch Invoked");

        let mut stream: Streaming<ImgProcRequest> = request.into_inner();
        let (tx, rx): (mpsc::Sender<_>, mpsc::Receiver<_>) = mpsc::channel(128);

        while let Some(request) = stream.message().await? {
            let tx: mpsc::Sender<_> = tx.clone();
            let semaphore: Arc<Semaphore> = Arc::clone(&self.semaphore);
            let processor: Arc<ImageProcessor> = Arc::clone(&self.processor);

            let _permit: OwnedSemaphorePermit = semaphore.acquire_owned().await
                .map_err(|_| Status::resource_exhausted("Too many concurrent requests"))?;

            tokio::spawn(async move {
                // TODO: add request validation
                let ImgProcRequest { model, image } = request;
                let model = ModelType::try_from(model).unwrap();

                let process_result: Result<CandleResult<String>, JoinError> =
                    task::spawn_blocking(move || processor.process_image(model, &image)).await;

                let response: Result<ImgProcResponse, Status> = match process_result {
                    Ok(Ok(description)) => {
                        let response = ImgProcResponse { description };
                        Ok(response)
                    }
                    Ok(Err(e)) => {
                        tracing::error!("Error processing image: {:?}", e);
                        Err(Status::internal(format!("Error processing image: {}", e)))
                    }
                    Err(e) => {
                        tracing::error!("Error executing blocking task: {:?}", e);
                        Err(Status::internal(format!("Error executing blocking task: {}", e)))
                    }
                };

                if let Err(e) = tx.send(response).await {
                    tracing::error!("Error sending response: {:?}", e);
                }

                drop(_permit);
            });
        }

        Ok(Response::new(ReceiverStream::new(rx)))
    }
}
