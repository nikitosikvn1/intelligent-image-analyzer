#![cfg(target_family = "unix")]
mod common;

use tokio_stream::{StreamExt, Once};
use tonic::{Request, Streaming};
use tonic::transport::Channel;
use tonic_reflection::pb::{ServerReflectionRequest, ServerReflectionResponse, ServiceResponse};
use tonic_reflection::pb::server_reflection_client::ServerReflectionClient;
use tonic_reflection::pb::server_reflection_request::MessageRequest;
use tonic_reflection::pb::server_reflection_response::MessageResponse;
use prost::Message;
use prost_types::FileDescriptorSet;
use grpc_vision_svc::proto::FILE_DESCRIPTOR_SET;

#[tokio::test]
#[cfg(target_family = "unix")]
#[ignore = "Integration test. Using Unix Domain Socket (UDS) for communication."]
async fn test_server_reflection_list_services() {
    // GIVEN
    let (serve_future, channel) = common::create_server_and_channel().await;

    let request = ServerReflectionRequest {
        host: String::new(),
        message_request: Some(MessageRequest::ListServices(String::new())),
    };

    let expected_response: Vec<ServiceResponse> = vec![
        ServiceResponse {
            name: String::from("computer_vision.ComputerVision"),
        },
        ServiceResponse {
            name: String::from("grpc.reflection.v1alpha.ServerReflection"),
        },
    ];

    let request_fututre = async {
        // WHEN
        let response: MessageResponse = make_test_reflection_request(request, channel).await;
        // THEN
        if let MessageResponse::ListServicesResponse(services) = response {
            assert_eq!(services.service, expected_response);
        } else {
            panic!("Expected a ListServicesResponse variant");
        }
    };

    tokio::select! {
        _ = serve_future => panic!("Server exited before client"),
        _ = request_fututre => (),
    }
}

#[tokio::test]
#[cfg(target_family = "unix")]
#[ignore = "Integration test. Using Unix Domain Socket (UDS) for communication."]
async fn test_server_reflection_file_by_filename() {
    // GIVEN
    let (serve_future, channel) = common::create_server_and_channel().await;

    let request = ServerReflectionRequest {
        host: String::new(),
        message_request: Some(MessageRequest::FileByFilename(
            "computer_vision.proto".into(),
        )),
    };

    let request_fututre = async {
        // WHEN
        let response: MessageResponse = make_test_reflection_request(request, channel).await;
        // THEN
        if let MessageResponse::FileDescriptorResponse(descriptor) = response {
            let file_descriptor_proto: &Vec<u8> = descriptor
                .file_descriptor_proto
                .first()
                .expect("Server response did not contain a file descriptor proto");

            assert_eq!(
                file_descriptor_proto.as_ref(),
                get_encoded_reflection_service_fd(),
            );
        } else {
            panic!("Expected a FileDescriptorResponse variant");
        }
    };

    tokio::select! {
        _ = serve_future => panic!("Server exited before client"),
        _ = request_fututre => (),
    }
}

#[tokio::test]
#[cfg(target_family = "unix")]
#[ignore = "Integration test. Using Unix Domain Socket (UDS) for communication."]
async fn test_server_reflection_file_containing_symbol() {
    // GIVEN
    let (serve_future, channel) = common::create_server_and_channel().await;

    let request = ServerReflectionRequest {
        host: String::new(),
        message_request: Some(MessageRequest::FileContainingSymbol(
            "computer_vision.ImgProcRequest".into(),
        )),
    };

    let request_fututre = async {
        // WHEN
        let response: MessageResponse = make_test_reflection_request(request, channel).await;
        // THEN
        if let MessageResponse::FileDescriptorResponse(descriptor) = response {
            let file_descriptor_proto: &Vec<u8> = descriptor
                .file_descriptor_proto
                .first()
                .expect("Server response did not contain a file descriptor proto");

            assert_eq!(
                file_descriptor_proto.as_ref(),
                get_encoded_reflection_service_fd(),
            );
        } else {
            panic!("Expected a FileDescriptorResponse variant");
        }
    };

    tokio::select! {
        _ = serve_future => panic!("Server exited before client"),
        _ = request_fututre => (),
    }
}

// Helper functions

async fn make_test_reflection_request(
    request: ServerReflectionRequest,
    channel: Channel,
) -> MessageResponse {
    let mut client: ServerReflectionClient<Channel> = ServerReflectionClient::new(channel);
    let request: Request<Once<ServerReflectionRequest>> = Request::new(tokio_stream::once(request));

    let mut inbound_stream: Streaming<ServerReflectionResponse> = client
        .server_reflection_info(request)
        .await
        .expect("Failed to send server reflection info request")
        .into_inner();

    let response: MessageResponse = inbound_stream
        .next()
        .await
        .expect("Failed to receive response from server")
        .expect("Server sent an error response")
        .message_response
        .expect("Server response did not contain a message response");

    // We only expect one response per request
    assert!(inbound_stream.next().await.is_none());

    response
}

fn get_encoded_reflection_service_fd() -> Vec<u8> {
    let mut bytes: Vec<u8> = Vec::new();

    FileDescriptorSet::decode(FILE_DESCRIPTOR_SET)
        .expect("decode reflection service file descriptor set")
        .file[0]
        .encode(&mut bytes)
        .expect("encode reflection service file descriptor");

    bytes
}
