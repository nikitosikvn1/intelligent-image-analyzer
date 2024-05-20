use std::sync::Arc;
use std::borrow::Cow;
use tonic::{Request, Response, Status, Streaming};
use tokio::sync::{mpsc, Semaphore, OwnedSemaphorePermit};
use tokio_stream::wrappers::ReceiverStream;
use crate::proto::{ImgProcRequest, ImgProcResponse, ModelType};
use crate::proto::computer_vision_server::ComputerVision;

const MAX_CONCURRENT_REQUESTS: usize = 12;

type ResponseResult<T> = Result<Response<T>, Status>;

#[derive(Debug)]
pub struct ComputerVisionSvc {}

#[allow(clippy::derivable_impls)] // Temp
impl Default for ComputerVisionSvc {
    fn default() -> Self {
        Self {}
    }
}

impl ComputerVisionSvc {}

#[tonic::async_trait]
impl ComputerVision for ComputerVisionSvc {
    type ProcessImageBatchStream = ReceiverStream<Result<ImgProcResponse, Status>>;

    // TODO: Implement process_image method
    async fn process_image(&self, request: Request<ImgProcRequest>) -> ResponseResult<ImgProcResponse> {
        tracing::info!(peer_addr = ?request.remote_addr(), "ProcessImage Invoked");

        let ImgProcRequest { model, image } = request.into_inner();

        if image.is_empty() {
            Err(Status::invalid_argument("Empty vector of bytes"))?;
        }
        // Decode the bytes into a UTF-8 string (not a real image processing, just a placeholder)
        let image: Cow<'_, str> = String::from_utf8_lossy(&image);
        let model: ModelType = ModelType::try_from(model).unwrap();

        let response = ImgProcResponse {
            description: format!("Model: {}. Decoded data: {}", model.as_str_name(), image),
        };

        Ok(Response::new(response))
    }

    // TODO: Implement process_image_batch method
    async fn process_image_batch(&self, request: Request<Streaming<ImgProcRequest>>) -> ResponseResult<Self::ProcessImageBatchStream> {
        tracing::info!(peer_addr = ?request.remote_addr(), "ProcessImageBatch Invoked");

        let mut stream: Streaming<ImgProcRequest> = request.into_inner();
        let (tx, rx): (mpsc::Sender<_>, mpsc::Receiver<_>) = mpsc::channel(128);
        // Limit the number of concurrent requests to 10 to avoid uncontrolled spawning
        // of async tasks (backpressure)
        let semaphore: Arc<Semaphore> = Arc::new(Semaphore::new(MAX_CONCURRENT_REQUESTS));

        while let Some(request) = stream.message().await? {
            let tx: mpsc::Sender<_> = tx.clone();
            let _permit: OwnedSemaphorePermit = semaphore.clone().acquire_owned().await.unwrap(); // TODO: Handle error

            tokio::spawn(async move {
                let ImgProcRequest { model, image } = request;

                let response: Result<ImgProcResponse, Status> = if image.is_empty() {
                    Err(Status::invalid_argument("Empty vector of bytes"))
                } else {
                    // Decode the bytes into a UTF-8 string (not a real image processing, just a placeholder)
                    let image: Cow<'_, str> = String::from_utf8_lossy(&image);
                    let model: ModelType = ModelType::try_from(model).unwrap();

                    let response = ImgProcResponse {
                        description: format!("Image processed successfully by {}: {}", model.as_str_name(), image),
                    };
                    Ok(response)
                };

                if let Err(e) = tx.send(response).await {
                    tracing::error!("Error sending response: {:?}", e); // rx is dropped
                }

                drop(_permit);
            });
        }

        Ok(Response::new(ReceiverStream::new(rx)))
    }
}

// Just as example, the tests are not exhaustive
#[cfg(test)]
mod tests {
    use super::*;
    //use tokio_stream::StreamExt;
    use once_cell::sync::Lazy;

    static SVC: Lazy<ComputerVisionSvc> = Lazy::new(ComputerVisionSvc::default);

    #[tokio::test]
    async fn test_process_image_ok() {
        // GIVEN
        let request: Request<ImgProcRequest> = Request::new(ImgProcRequest {
            model: ModelType::BlipQuantized as i32,
            image: "Hello, world!".as_bytes().to_vec(),
        });
        // WHEN
        let response: Response<ImgProcResponse> = SVC.process_image(request).await.unwrap();
        let response: ImgProcResponse = response.into_inner();
        // THEN
        assert_eq!(
            response.description,
            "Model: BLIP_QUANTIZED. Decoded data: Hello, world!",
        );
    }

    #[tokio::test]
    async fn test_process_image_empty_image() {
        // GIVEN
        let request: Request<ImgProcRequest> = Request::new(ImgProcRequest {
            model: ModelType::BlipQuantized as i32,
            image: Vec::new(),
        });
        // WHEN
        let status: Status = SVC.process_image(request).await.unwrap_err();
        // THEN
        assert_eq!(status.code(), tonic::Code::InvalidArgument);
        assert_eq!(status.message(), "Empty vector of bytes");
    }

    // #[tokio::test]
    // async fn test_process_image_batch_ok() {
    //     // GIVEN
    //     let _img_proc_requests: Vec<ImgProcRequest> = vec![
    //         ImgProcRequest {
    //             model: ModelType::Blip as i32,
    //             image: b"Hello, world!".to_vec(),
    //         },
    //         ImgProcRequest {
    //             model: ModelType::BlipQuantized as i32,
    //             image: b"Hello, Rust!".to_vec(),
    //         },
    //         ImgProcRequest {
    //             model: ModelType::Blip as i32,
    //             image: b"Hello, Tonic!".to_vec(),
    //         },
    //     ];

    //     unimplemented!("Idk how to test this shit");
    // }
}
