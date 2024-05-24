#![allow(unused)]
pub mod model_loader;
pub mod token_output_stream;
pub mod utils;

use std::collections::HashMap;
use tokenizers::Tokenizer;
use image::{ImageBuffer, Rgb};
use candle_core::{Result, Tensor, DType, Device, Error, Module};
use candle_nn::var_builder::{VarBuilder, VarBuilderArgs, SimpleBackend};
use candle_transformers::models::{blip, quantized_blip};
use candle_transformers::generation::{Sampling, LogitsProcessor};
use crate::proto::ModelType;
use crate::image_captioning::model_loader::{Models, Model};

const SEP_TOKEN_ID: u32 = 102;

#[non_exhaustive]
#[derive(Debug, Clone)]
pub enum ModelVariant {
    Blip(blip::BlipForConditionalGeneration),
    QuantizedBlip(quantized_blip::BlipForConditionalGeneration),
}

impl Module for ModelVariant {
    fn forward(&self, xs: &Tensor) -> Result<Tensor> {
        match self {
            Self::Blip(m) => m.vision_model().forward(xs),
            Self::QuantizedBlip(m) => m.vision_model().forward(xs),
        }
    }
}

impl ModelVariant {
    fn text_decoder_forward(&mut self, xs: &Tensor, img_xs: &Tensor) -> Result<Tensor> {
        match self {
            Self::Blip(m) => m.text_decoder().forward(xs, img_xs),
            Self::QuantizedBlip(m) => m.text_decoder().forward(xs, img_xs),
        }
    }

    fn reset_kv_cache(&mut self) {
        match self {
            Self::Blip(m) => m.reset_kv_cache(),
            Self::QuantizedBlip(m) => m.reset_kv_cache(),
        }
    }
}

#[derive(Clone)]
pub struct ImageProcessor {
    models: HashMap<ModelType, ModelVariant>,
    device: Device,
    tokenizer: Tokenizer,
    sampling: Sampling,
}

impl ImageProcessor {
    pub fn new(models: &Models, device: Device) -> Result<Self> {
        let blip_cfg: &Model = models
            .get("Salesforce/blip-image-captioning-large")
            .ok_or_else(|| Error::Msg("BLIP Model not found".into()))?;

        let blip_quantized_cfg: &Model = models
            .get("lmz/candle-blip")
            .ok_or_else(|| Error::Msg("Quantized BLIP Model not found".into()))?;

        let config = blip::Config::image_captioning_large();
        let mut model_map: HashMap<ModelType, ModelVariant> = HashMap::new();

        let vb: VarBuilderArgs<Box<dyn SimpleBackend>> = unsafe {
            VarBuilder::from_mmaped_safetensors(&[blip_cfg.model_path()], DType::F32, &device)?
        };
        model_map.insert(
            ModelType::Blip,
            ModelVariant::Blip(blip::BlipForConditionalGeneration::new(&config, vb)?),
        );

        let vb = quantized_blip::VarBuilder::from_gguf(blip_quantized_cfg.model_path(), &device)?;
        model_map.insert(
            ModelType::BlipQuantized,
            ModelVariant::QuantizedBlip(quantized_blip::BlipForConditionalGeneration::new(&config, vb)?),
        );

        let tokenizer = Tokenizer::from_file(blip_cfg.tokenizer_path()).unwrap();

        Ok(Self {
            models: model_map,
            device,
            tokenizer,
            sampling: Sampling::ArgMax,
        })
    }

    pub fn process_image(&self, model: ModelType, image: &[u8]) -> Result<String> {
        let model_var: &ModelVariant = self.models.get(&model).unwrap(); // TODO: Handle error
        let image: ImageBuffer<Rgb<u8>, Vec<u8>> = utils::process_image(image).map_err(Error::wrap)?;
        let tensor: Tensor = utils::create_tensor(&image.into_raw(), &Device::Cpu)?.to_device(&self.device)?;

        tracing::debug!("Image tensor: {:?}", tensor);
        let image_embeddings: Tensor = tensor.unsqueeze(0)?.apply(model_var)?;

        self.generate_text(model, &image_embeddings)
    }

    fn generate_text(&self, model: ModelType, image_embeds: &Tensor) -> Result<String> {
        let mut model: ModelVariant = self.models.get(&model)
            .unwrap()
            .clone();

        let mut logits_processor: LogitsProcessor = LogitsProcessor::from_sampling(1337, self.sampling.clone());
        let mut token_ids: Vec<u32> = vec![30522];

        for index in 0..1000 {
            let context_size: usize = if index > 0 { 1 } else { token_ids.len() };
            let start_pos: usize = token_ids.len().saturating_sub(context_size);
            let input_ids: Tensor = Tensor::new(&token_ids[start_pos..], &self.device)?.unsqueeze(0)?;
            let logits: Tensor = model.text_decoder_forward(&input_ids, image_embeds)?.squeeze(0)?;
            let logits: Tensor = logits.get(logits.dim(0)? - 1)?;
            let token: u32 = logits_processor.sample(&logits)?;
            if token == SEP_TOKEN_ID {
                break;
            }
            token_ids.push(token);
        }
        self.tokenizer.decode(&token_ids, true).map_err(Error::Wrapped)
    }
}
