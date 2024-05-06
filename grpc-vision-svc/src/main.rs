use std::env;
use std::net::SocketAddr;
use tonic::transport::Server;
use tonic_reflection::server::Builder as ReflectionBuilder;
use tracing_subscriber::filter::{EnvFilter, LevelFilter};

use grpc_vision_svc::proto::FILE_DESCRIPTOR_SET;
use grpc_vision_svc::proto::computer_vision_server::ComputerVisionServer;
use grpc_vision_svc::service_impl::ComputerVisionSvc;

const SERVER_ADDR_ENV: &str = "SERVER_ADDR";

async fn shutdown_signal() {
    tokio::signal::ctrl_c()
        .await
        .expect("Failed to listen for Ctrl-C signal");

    tracing::info!("Received Ctrl-C signal, shutting down...");
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .compact()
        .with_target(false)
        .with_env_filter(
            EnvFilter::builder()
                .with_default_directive(LevelFilter::INFO.into())
                .from_env_lossy(),
        )
        .init();

    let addr: SocketAddr = env::var(SERVER_ADDR_ENV)
        .unwrap_or_else(|_| "[::]:50051".to_string())
        .parse()
        .expect("Invalid socket address");

    let reflection_svc = ReflectionBuilder::configure()
        .register_encoded_file_descriptor_set(FILE_DESCRIPTOR_SET)
        .build()?;

    let computer_vision_svc = ComputerVisionSvc::default();

    tracing::info!(addr = %addr, "Starting gRPC server...");

    Server::builder()
        .trace_fn(|request| tracing::debug_span!("grpc", ?request))
        .add_service(reflection_svc)
        .add_service(ComputerVisionServer::new(computer_vision_svc))
        .serve_with_shutdown(addr, shutdown_signal())
        .await?;

    Ok(())
}
