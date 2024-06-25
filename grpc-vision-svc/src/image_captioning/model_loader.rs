use std::fs;
use std::collections::HashMap;
use std::path::{Path, PathBuf};

use thiserror::Error;
use serde::Deserialize;
use hf_hub::{Repo, RepoType};
use hf_hub::api::sync::{Api, ApiRepo, ApiError};

#[cfg(test)]
use mockall::automock;

/// [`ModelLoaderError`] is an enumeration of potential errors that can occur
/// during the model loading process. It includes API errors, I/O errors,
/// and parsing errors. Each variant wraps the underlying error for further
/// inspection if necessary.
///
/// * `ApiError`: This variant is used when an error occurs while interacting
///   with the API during the model loading process.
/// * `IoError`: This variant is used when an I/O error occurs, for example,
///   when reading the model configuration file.
/// * `ParseError`: This variant is used when an error occurs while parsing
///   the model configuration file.
///
/// Each variant uses the `#[from]` attribute to automatically implement the [`From`] trait,
/// allowing for easy conversion from the wrapped error types to [`ModelLoaderError`].
#[derive(Error, Debug)]
pub enum ModelLoaderError {
    #[error("API error occurred while loading model: {0}")]
    ApiError(#[from] ApiError),

    #[error("I/O error occurred while reading model config: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Error occurred while parsing model config: {0}")]
    ParseError(#[from] toml::de::Error),
}

/// [`Result`] with default error type [`ModelLoaderError`].
pub type Result<T, E = ModelLoaderError> = std::result::Result<T, E>;

/// A type alias for a [`HashMap`] that maps model repository names to [`Model`] instances.
/// This is used to store multiple models loaded from a TOML configuration file.
pub type Models = HashMap<String, Model>;

/// [`Config`] is a struct representing the configuration for a set of models.
/// It is primarily used for deserializing a TOML document.
#[derive(Debug, Deserialize)]
struct Config {
    #[serde(rename = "model")]
    models: Vec<ModelConfig>,
}

/// [`ModelConfig`] is a struct representing the model data in the config file.
/// It corresponds to a single `[[model]]` section in the TOML document.
#[derive(Debug, Deserialize)]
pub struct ModelConfig {
    pub repository: String,
    pub revision: Option<String>,
    pub model: String,
    pub tokenizer: String,
}

/// [`Model`] is a struct representing a downloaded model.
/// It contains the paths to the model and tokenizer files.
/// These paths can be used to load the model and tokenizer in your ML library of choice.
#[derive(Debug, Clone)]
pub struct Model {
    model_path: PathBuf,
    tokenizer_path: PathBuf,
}

#[cfg(not(tarpaulin_include))]
impl Model {
    /// Returns a reference to the path of the model file.
    pub fn model_path(&self) -> &PathBuf {
        &self.model_path
    }

    /// Returns a reference to the path of the tokenizer file.
    pub fn tokenizer_path(&self) -> &PathBuf {
        &self.tokenizer_path
    }

    /// Consumes the [`Model`] instance and returns the inner paths as a tuple.
    pub fn into_inner(self) -> (PathBuf, PathBuf) {
        (self.model_path, self.tokenizer_path)
    }
}

/// `ModelLoaderApi` is a trait that abstracts the API used to retrieve hf repositories.
/// Primarily used for dependency injection and testing purposes.
#[cfg_attr(test, automock(type Repo = MockModelLoaderApiRepo;))]
pub trait ModelLoaderApi {
    type Repo: ModelLoaderApiRepo;
    fn repo(&self, repo: Repo) -> Self::Repo;
    fn model(&self, model_id: String) -> Self::Repo;
}

#[cfg(not(tarpaulin_include))]
impl ModelLoaderApi for Api {
    type Repo = ApiRepo;

    fn repo(&self, repo: Repo) -> Self::Repo {
        Api::repo(self, repo)
    }

    fn model(&self, model_id: String) -> Self::Repo {
        Api::model(self, model_id)
    }
}

/// `ModelLoaderApiRepo` is a trait that abstracts the repository API methods.
/// It provides a single method `get` that retrieves a file from the repository.
/// This trait is used for dependency injection and testing purposes.
#[cfg_attr(test, automock)]
pub trait ModelLoaderApiRepo {
    fn get(&self, filename: &str) -> Result<PathBuf, ApiError>;
}

#[cfg(not(tarpaulin_include))]
impl ModelLoaderApiRepo for ApiRepo {
    fn get(&self, filename: &str) -> Result<PathBuf, ApiError> {
        ApiRepo::get(self, filename)
    }
}

// TODO: Rewrite to async version

/// [`ModelLoader`] is a struct used to load models from the Hugging Face API.
pub struct ModelLoader<T: ModelLoaderApi> {
    api: T,
}

impl<T: ModelLoaderApi> ModelLoader<T> {
    /// Creates a new instance of [`ModelLoader`] with the provided API.
    ///
    /// # Parameters
    ///
    /// * `api`: An instance of a type implementing the [`ModelLoaderApi`] trait.
    ///
    /// # Returns
    ///
    /// A new [`ModelLoader`] instance.
    ///
    /// # Example
    ///
    /// ```
    /// let api = ApiBuilder::new()
    ///     .with_token(Some("API_TOKEN".into()))
    ///     .with_cache_dir(PathBuf::from("./cache/models"))
    ///     .build()
    ///     .unwrap();
    ///
    /// let loader = ModelLoader::new(api);
    /// ```
    pub fn new(api: T) -> Self {
        Self { api }
    }

    /// Loads a model from the Hugging Face API based on the provided [`ModelConfig`].
    ///
    /// # Parameters
    ///
    /// * `model_cfg`: A reference to a [`ModelConfig`] that specifies the model to load.
    ///
    /// # Returns
    ///
    /// A [`Model`] struct containing the paths to the model and tokenizer files.
    ///
    /// # Example
    ///
    /// ```
    /// let config = ModelConfig {
    ///     repository: "google-bert/bert-base-uncased".to_string(),
    ///     revision: None,
    ///     model: "model.safetensors".to_string(),
    ///     tokenizer: "tokenizer.json".to_string(),
    /// };
    /// let api = ApiBuilder::new()
    ///     .with_token(Some("API_TOKEN".into()))
    ///     .with_cache_dir(PathBuf::from("./cache/models"))
    ///     .build()
    ///     .unwrap();
    ///
    /// let loader = ModelLoader::new(api);
    /// let model = loader.load(&config).unwrap();
    /// ```
    pub fn load(&self, model_cfg: &ModelConfig) -> Result<Model> {
        let api: <T as ModelLoaderApi>::Repo = if let Some(ref revision) = model_cfg.revision {
            self.api.repo(Repo::with_revision(
                model_cfg.repository.clone(),
                RepoType::Model,
                revision.clone(),
            ))
        } else {
            self.api.model(model_cfg.repository.clone())
        };

        let model_path: PathBuf = api.get(&model_cfg.model)?;
        let tokenizer_path: PathBuf = api.get(&model_cfg.tokenizer)?;

        Ok(Model {
            model_path,
            tokenizer_path,
        })
    }

    /// Loads models specified in a TOML configuration file.
    /// The TOML file should contain one or more `[[model]]` tables, each specifying a model to load.
    /// Each table is deserialized into a [`ModelConfig`] instance and used to load a model from the Hugging Face API.
    /// The loaded models are returned in a [`Models`] instance (a [`HashMap`]).
    ///
    /// # Parameters
    ///
    /// * `path`: A reference to a [`Path`] pointing to the TOML configuration file.
    ///
    /// # Returns
    ///
    /// A [`HashMap`] where the keys are the repository names and the values are
    /// the corresponding [`Model`] structs.
    ///
    /// # Example
    ///
    /// ```
    /// let api = Api::new().unwrap();
    /// let loader = ModelLoader::new(api);
    /// let models = loader.load_from_toml("models.toml").unwrap();
    ///
    /// assert!(models.get("Salesforce/blip-image-captioning-large").is_some());
    /// assert!(models.get("microsoft/kosmos-2-patch14-224").is_some());
    /// ```
    ///
    /// # Example TOML config file
    ///
    /// ```toml
    /// [[model]]
    /// repository = "Salesforce/blip-image-captioning-large"
    /// revision = "refs/pr/18" # Optional
    /// model = "model.safetensors"
    /// tokenizer = "tokenizer.json"
    ///
    /// [[model]]
    /// repository = "microsoft/kosmos-2-patch14-224"
    /// model = "model.safetensors"
    /// tokenizer = "tokenizer.json"
    /// ```
    pub fn load_from_toml<P: AsRef<Path>>(&self, path: P) -> Result<Models> {
        let config_str: String = fs::read_to_string(path)?;
        let config: Config = toml::from_str(&config_str)?;
        
        config.models
            .into_iter()
            .map(|model_cfg| {
                let model: Model = self.load(&model_cfg)?;
                Ok((model_cfg.repository, model))
            })
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{Write, ErrorKind};
    use mockall::predicate;
    use tempfile::NamedTempFile;

    #[test]
    fn test_model_loader_load_no_revision() {
        // GIVEN
        let mut mock_api = MockModelLoaderApi::new();
        mock_api
            .expect_model()
            .with(predicate::eq("some-repo/test-model".to_string()))
            .times(1)
            .returning(|_| {
                let mut mock_repo = MockModelLoaderApiRepo::new();
                mock_repo
                    .expect_get()
                    .with(predicate::eq("model.safetensors"))
                    .times(1)
                    .return_once(|_| Ok(PathBuf::from("some/path/model.safetensors")));
                mock_repo
                    .expect_get()
                    .with(predicate::eq("tokenizer.json"))
                    .times(1)
                    .return_once(|_| Ok(PathBuf::from("some/path/tokenizer.json")));

                mock_repo
            });

        let model_cfg = ModelConfig {
            repository: "some-repo/test-model".to_string(),
            revision: None,
            model: "model.safetensors".to_string(),
            tokenizer: "tokenizer.json".to_string(),
        };
        // WHEN
        let loader: ModelLoader<MockModelLoaderApi> = ModelLoader::new(mock_api);
        let model: Model = loader.load(&model_cfg).unwrap();
        // THEN
        assert_eq!(
            model.model_path().to_str(),
            Some("some/path/model.safetensors"),
        );
        assert_eq!(
            model.tokenizer_path().to_str(),
            Some("some/path/tokenizer.json"),
        );
    }

    #[test]
    fn test_model_loader_load_with_revision() {
        // GIVEN
        let mut mock_api = MockModelLoaderApi::new();
        mock_api
            .expect_repo()
            .withf(|repo| {
                repo.folder_name() == "models--some-repo--test-model" && repo.revision() == "main"
            })
            .times(1)
            .returning(|_| {
                let mut mock_repo = MockModelLoaderApiRepo::new();
                mock_repo
                    .expect_get()
                    .with(predicate::eq("model.safetensors"))
                    .times(1)
                    .return_once(|_| Ok(PathBuf::from("some/path/model.safetensors")));
                mock_repo
                    .expect_get()
                    .with(predicate::eq("tokenizer.json"))
                    .times(1)
                    .return_once(|_| Ok(PathBuf::from("some/path/tokenizer.json")));

                mock_repo
            });

        let model_cfg = ModelConfig {
            repository: "some-repo/test-model".to_string(),
            revision: Some("main".to_string()),
            model: "model.safetensors".to_string(),
            tokenizer: "tokenizer.json".to_string(),
        };
        // WHEN
        let loader: ModelLoader<MockModelLoaderApi> = ModelLoader::new(mock_api);
        let model: Model = loader.load(&model_cfg).unwrap();
        // THEN
        assert_eq!(
            model.model_path().to_str(),
            Some("some/path/model.safetensors"),
        );
        assert_eq!(
            model.tokenizer_path().to_str(),
            Some("some/path/tokenizer.json"),
        );
    }

    #[test]
    fn test_model_loader_load_api_error() {
        // GIVEN
        let mut mock_api = MockModelLoaderApi::new();
        mock_api
            .expect_model()
            .with(predicate::eq("some-repo/test-model".to_string()))
            .times(1)
            .returning(|_| {
                let mut mock_repo = MockModelLoaderApiRepo::new();
                mock_repo
                    .expect_get()
                    .times(1)
                    .return_once(|_| Err(ApiError::IoError(ErrorKind::PermissionDenied.into())));

                mock_repo
            });

        let model_cfg = ModelConfig {
            repository: "some-repo/test-model".to_string(),
            revision: None,
            model: "model.safetensors".to_string(),
            tokenizer: "tokenizer.json".to_string(),
        };
        // WHEN
        let loader: ModelLoader<MockModelLoaderApi> = ModelLoader::new(mock_api);
        let result: Result<Model> = loader.load(&model_cfg);
        // THEN
        assert!(result.is_err());
        assert!(
            matches!(result, Err(ModelLoaderError::ApiError(ApiError::IoError(ref e))) if e.kind() == ErrorKind::PermissionDenied)
        );
    }

    #[test]
    #[ignore = "Interacts with the filesystem"]
    fn test_model_loader_load_from_toml() {
        // GIVEN
        let mut mock_api = MockModelLoaderApi::new();
        mock_api
            .expect_model()
            .times(2)
            .returning(|_| {
                let mut mock_repo = MockModelLoaderApiRepo::new();
                mock_repo
                    .expect_get()
                    .times(1)
                    .return_once(|_| Ok(PathBuf::from("some/path/model.safetensors")));
                mock_repo
                    .expect_get()
                    .times(1)
                    .return_once(|_| Ok(PathBuf::from("some/path/tokenizer.json")));
                    
                mock_repo
            });

        let toml_str: &str = r#"
            [[model]]
            repository = "some-repo/test-model"
            model = "model.safetensors"
            tokenizer = "tokenizer.json"

            [[model]]
            repository = "another-repo/another-model"
            model = "model.safetensors"
            tokenizer = "tokenizer.json"
        "#;
        let mut temp_config = NamedTempFile::new().unwrap();
        write!(temp_config, "{}", toml_str).unwrap();
        // WHEN
        let loader: ModelLoader<MockModelLoaderApi> = ModelLoader::new(mock_api);
        let models: Models = loader.load_from_toml(temp_config.path()).unwrap();
        temp_config.close().unwrap();
        // THEN
        assert_eq!(models.len(), 2);

        let model_1: &Model = models.get("some-repo/test-model").unwrap();
        assert_eq!(
            model_1.model_path().to_str(),
            Some("some/path/model.safetensors"),
        );
        assert_eq!(
            model_1.tokenizer_path().to_str(),
            Some("some/path/tokenizer.json"),
        );

        let model_2: &Model = models.get("another-repo/another-model").unwrap();
        assert_eq!(
            model_2.model_path().to_str(),
            Some("some/path/model.safetensors"),
        );
        assert_eq!(
            model_2.tokenizer_path().to_str(),
            Some("some/path/tokenizer.json"),
        );
    }

    #[test]
    #[ignore = "Interacts with the filesystem"]
    fn test_model_loader_load_from_toml_invalid_toml() {
        // GIVEN
        let mock_api = MockModelLoaderApi::new();
        let mut temp_config = NamedTempFile::new().unwrap();
        write!(temp_config, "invalid toml content!").unwrap();
        // WHEN
        let loader: ModelLoader<MockModelLoaderApi> = ModelLoader::new(mock_api);
        let result: Result<Models> = loader.load_from_toml(temp_config.path());
        temp_config.close().unwrap();
        // THEN
        assert!(result.is_err());
        assert!(matches!(result, Err(ModelLoaderError::ParseError(_))));
    }

    #[test]
    fn test_model_loader_load_from_toml_io_error() {
        // GIVEN
        let mock_api = MockModelLoaderApi::new();
        // WHEN
        let loader: ModelLoader<MockModelLoaderApi> = ModelLoader::new(mock_api);
        let result: Result<Models> = loader.load_from_toml("non_existent_file.toml");
        // THEN
        assert!(result.is_err());
        assert!(matches!(result, Err(ModelLoaderError::IoError(_))));
    }
}
