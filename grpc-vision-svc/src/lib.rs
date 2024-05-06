pub mod proto {
    tonic::include_proto!("computer_vision");
    pub const FILE_DESCRIPTOR_SET: &[u8] = tonic::include_file_descriptor_set!("vision_svc_descriptor");
}

pub mod image_captioning;
pub mod service_impl;
