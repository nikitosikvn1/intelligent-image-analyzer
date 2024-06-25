use std::env;
use std::path::Path;
use std::net::SocketAddr;
use tonic::transport::Server;
use tonic::codec::CompressionEncoding;
use tonic_reflection::server::Builder as ReflectionBuilder;
use tracing_subscriber::filter::{EnvFilter, LevelFilter};
use candle_core::Device;
use hf_hub::api::sync::Api;
use anyhow::{Context, Result};

use grpc_vision_svc::proto::FILE_DESCRIPTOR_SET;
use grpc_vision_svc::proto::computer_vision_server::ComputerVisionServer;
use grpc_vision_svc::service_impl::ComputerVisionSvc;
use grpc_vision_svc::image_captioning::utils::{self, DefaultDeviceUtils};
use grpc_vision_svc::image_captioning::model_loader::{ModelLoader, Models};

/// Retrieves the server address from the `VISION_ADDR` environment variable.
/// Defaults to `[::1]:50051` if the variable is not set or has an invalid format.
fn get_server_address() -> SocketAddr {
    env::var("VISION_ADDR")
        .ok()
        .and_then(|addr| addr.parse().ok())
        .unwrap_or_else(|| "[::1]:50051".parse().unwrap())
}

/// Retrieves the path to the models configuration file from the `VISION_MODELS_PATH` environment variable.
/// If the variable is not set, it defaults to `models.toml` in the current directory.
fn get_models_path() -> Result<String> {
    env::var("VISION_MODELS_PATH").or_else(|_| {
        tracing::warn!(r#""VISION_MODELS_PATH" environment variable is not set, using default path"#);
        if !Path::new("models.toml").exists() {
            anyhow::bail!(
                r#"Failed to find "models.toml" in the default path. Please set "VISION_MODELS_PATH" to the correct path."#,
            );
        }
        Ok(String::from("models.toml"))
    })
}

async fn shutdown_signal() {
    tokio::signal::ctrl_c()
        .await
        .expect("Failed to listen for Ctrl-C signal");

    tracing::info!("Received Ctrl-C signal, shutting down...");
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .compact()
        .with_target(false)
        .with_env_filter(
            EnvFilter::builder()
                .with_default_directive(LevelFilter::INFO.into())
                .from_env_lossy(),
        )
        .init();

    let addr: SocketAddr = get_server_address();
    let models_path: String = get_models_path().context("Failed to get models path")?;

    let model_loader: ModelLoader<Api> = ModelLoader::new(Api::new()?);
    let models: Models = model_loader.load_from_toml(&models_path)?;
    let device: Device = utils::device(false, &DefaultDeviceUtils)?;

    let reflection_svc = ReflectionBuilder::configure()
        .register_encoded_file_descriptor_set(FILE_DESCRIPTOR_SET)
        .build()?;

    let vision_svc: ComputerVisionServer<ComputerVisionSvc> = ComputerVisionServer::new(ComputerVisionSvc::new(&models, device)?)
        .max_decoding_message_size(12 * 1024 * 1024)
        .send_compressed(CompressionEncoding::Gzip)
        .accept_compressed(CompressionEncoding::Gzip);

    tracing::info!(addr = %addr, "Starting gRPC server...");

    Server::builder()
        .trace_fn(|request| tracing::debug_span!("grpc", ?request))
        .add_service(reflection_svc)
        .add_service(vision_svc)
        .serve_with_shutdown(addr, shutdown_signal())
        .await?;

    Ok(())
}
