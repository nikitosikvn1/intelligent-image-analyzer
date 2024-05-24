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

const MAX_CONCURRENT_REQUESTS: usize = 16;

type ResponseResult<T> = Result<Response<T>, Status>;

pub struct ComputerVisionSvc {
    processor: Arc<ImageProcessor>,
    semaphore: Arc<Semaphore>,
}

impl ComputerVisionSvc {
    pub fn new(models: &Models, device: Device) -> CandleResult<Self> {
        Ok(Self {
            processor: Arc::new(ImageProcessor::new(models, device)?),
            semaphore: Arc::new(Semaphore::new(MAX_CONCURRENT_REQUESTS)),
        })
    }

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
    type ProcessImageBatchStream = ReceiverStream<Result<ImgProcResponse, Status>>;

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
                let ImgProcRequest { model, image } = request;
                let model = ModelType::try_from(model).unwrap(); // TODO: Handle error

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

