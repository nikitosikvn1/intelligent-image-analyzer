#![cfg(target_family = "unix")]
use std::path::{Path, PathBuf};
use std::future::Future;
use tokio::fs;
use tokio::net::{UnixListener, UnixStream};
use tokio_stream::wrappers::UnixListenerStream;
use tonic::transport::{Server, Channel, Endpoint, Uri, Error};
use tonic_reflection::server::Builder as ReflectionBuilder;
use tonic_reflection::server::ServerReflectionServer;
use tempfile::{NamedTempFile, TempPath};

use grpc_vision_svc::proto::FILE_DESCRIPTOR_SET;

pub async fn create_server_and_channel() -> (impl Future<Output = ()>, Channel) {
    let socket: NamedTempFile = NamedTempFile::new().unwrap();
    let socket: TempPath = socket.into_temp_path();
    fs::remove_file(&socket)
        .await
        .expect("Failed to delete file");

    eprintln!("socket: {:?}", socket.display());

    let uds: UnixListener = UnixListener::bind(&socket).unwrap();
    let stream: UnixListenerStream = UnixListenerStream::new(uds);

    let serve_future = create_server(stream);
    let channel: Channel = create_channel(&socket).await.unwrap();

    (serve_future, channel)
}

async fn create_server(stream: UnixListenerStream) {
    // let server: ComputerVisionServer<ComputerVisionSvc> =
    //     ComputerVisionServer::new(ComputerVisionSvc::new(&models, device).unwrap());

    let reflection_svc: ServerReflectionServer<_> = ReflectionBuilder::configure()
        .register_encoded_file_descriptor_set(FILE_DESCRIPTOR_SET)
        .build()
        .expect("Failed to build reflection service");

    Server::builder()
        .add_service(reflection_svc)
        // .add_service(server)
        .serve_with_incoming(stream)
        .await
        .expect("Server failed to start")
}

async fn create_channel<P: AsRef<Path>>(socket: P) -> Result<Channel, Error> {
    let socket: PathBuf = socket.as_ref().to_owned();

    Endpoint::try_from("http://[::1]:50051")
        .unwrap()
        .connect_with_connector(tower::service_fn(move |_: Uri| {
            // Connect to a UDS path instead
            let socket_clone: PathBuf = socket.clone();
            async move { UnixStream::connect(&socket_clone).await }
        }))
        .await
}
