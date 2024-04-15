use anyhow::{anyhow, Result};
use async_openai::types::CreateEmbeddingRequestArgs;
use fastembed::{EmbeddingBase, FlagEmbedding, InitOptions};
use std::sync::Arc as arc;
use std::sync::Arc;
use async_openai::config::OpenAIConfig;
use mongodb::Database;
use ort::{CoreMLExecutionProvider, CUDAExecutionProvider, ExecutionProvider, ExecutionProviderDispatch, ROCmExecutionProvider};
use tokio::sync::mpsc;
use tokio::sync::RwLock;
use tokio::task;
use crate::init::env_variables::GLOBAL_DATA;

use crate::llm::models::{EmbeddingModels, FastEmbedModels};
use crate::mongo::queries::get_model_credentials;

pub async fn embed_text(
    mongo_conn: Arc<RwLock<Database>>,
    datasource_id: String,
    text: Vec<&String>,
    model: &EmbeddingModels,
) -> Result<Vec<Vec<f32>>> {
    match model {
        EmbeddingModels::UNKNOWN => Err(anyhow!("This is an unknown model type!")),
        // Group all fast embed models together
        EmbeddingModels::BAAI_BGE_SMALL_EN
        | EmbeddingModels::BAAI_BGE_SMALL_EN_V1_5
        | EmbeddingModels::BAAI_BGE_BASE_EN
        | EmbeddingModels::BAAI_BGE_BASE_EN_V1_5
        | EmbeddingModels::ENTENCE_TRANSFORMERS_ALL_MINILM_L6_V2
        | EmbeddingModels::XENOVA_FAST_MULTILINGUAL_E5_LARGE => match model.to_str() {
            Some(m) => {
                let global_data = GLOBAL_DATA.read().await;
                let model = FastEmbedModels::from(m.to_string());
                match FastEmbedModels::translate(&model) {
                    Some(translation) => {
                        match global_data.use_gpu.as_str() {
                            "false" => {
                                let model: FlagEmbedding = FlagEmbedding::try_new(InitOptions {
                                    model_name: translation,
                                    show_download_message: true,
                                    ..Default::default()
                                })?;
                                let embeddings = model.passage_embed(text, None)?;
                                Ok(embeddings)
                            }
                            _ => {
                                log::debug!("Checking for hardware acceleration...");
                                log::debug!("Checking for CoreML...");
                                let coreml = CoreMLExecutionProvider::default();
                                match coreml.is_available() {
                                    Ok(acceleration) => {
                                        if acceleration {
                                            log::debug!("Found CoreML...");
                                            let model: FlagEmbedding = FlagEmbedding::try_new(InitOptions {
                                                model_name: translation,
                                                show_download_message: true,
                                                execution_providers: vec![ExecutionProviderDispatch::CoreML(coreml)],
                                                ..Default::default()
                                            })?;
                                            let embeddings = model.passage_embed(text, None)?;
                                            Ok(embeddings)
                                        } else {
                                            log::debug!("CoreML was not available");
                                            log::debug!("Looking for CUDA hardware...");
                                            let cuda = CUDAExecutionProvider::default();
                                            match cuda.is_available() {
                                                Ok(acceleration) => {
                                                    if acceleration {
                                                        log::debug!("Found CUDA...");
                                                        let model: FlagEmbedding = FlagEmbedding::try_new(InitOptions {
                                                            model_name: translation,
                                                            show_download_message: true,
                                                            execution_providers: vec![ExecutionProviderDispatch::CUDA(cuda)],
                                                            ..Default::default()
                                                        })?;
                                                        let embeddings = model.passage_embed(text, None)?;
                                                        Ok(embeddings)
                                                    } else {
                                                        log::debug!("CUDA was  not available");
                                                        log::debug!("Checking for ROCm...");
                                                        let roc = ROCmExecutionProvider::default();
                                                        match roc.is_available() {
                                                            Ok(acceleration) => {
                                                                if acceleration {
                                                                    log::debug!("Found ROCm...");
                                                                    let model: FlagEmbedding = FlagEmbedding::try_new(InitOptions {
                                                                        model_name: translation,
                                                                        show_download_message: true,
                                                                        execution_providers: vec![ExecutionProviderDispatch::ROCm(roc)],
                                                                        ..Default::default()
                                                                    })?;
                                                                    let embeddings = model.passage_embed(text, None)?;
                                                                    Ok(embeddings)
                                                                } else {
                                                                    log::debug!("No hardware acceleration found...falling back to CPU");
                                                                    let model: FlagEmbedding = FlagEmbedding::try_new(InitOptions {
                                                                        model_name: translation,
                                                                        show_download_message: true,
                                                                        ..Default::default()
                                                                    })?;
                                                                    let embeddings = model.passage_embed(text, None)?;
                                                                    Ok(embeddings)
                                                                }
                                                            }
                                                            Err(e) => Err(anyhow!("Error occurred while looking for ROCm hardware: {}",e))
                                                        }
                                                    }
                                                }
                                                Err(e) => Err(anyhow!("Error occurred while looking for CUDA hardware: {}",e))
                                            }
                                        }
                                    }
                                    Err(e) =>
                                        Err(anyhow!("An error occurred while looking for CoreML hardware: {}", e))
                                }
                            }
                        }
                    }
                    None => Err(anyhow!(
                        "Model does not match any known fast embed model variants"
                    )),
                }
            }
            None => Err(anyhow!("Model type unknown")),
        },

        // Group all OAI models
        _ => match model.to_str() {
            Some(m) => {
                // initiate variables
                let mongodb_connection = mongo_conn.read().await;
                match get_model_credentials(&mongodb_connection, datasource_id.as_str()).await {
                    Ok(Some(creds_obj)) => {
                        match creds_obj.key {
                            Some(k) => {
                                let backoff = backoff::ExponentialBackoffBuilder::new()
                                    .with_max_elapsed_time(Some(std::time::Duration::from_secs(60)))
                                    .build();
                                let mut config = OpenAIConfig::new()
                                    .with_api_key(k);
                                if let Some(org) = creds_obj.org {
                                    config = config.with_org_id(org);
                                }
                                let client = async_openai::Client::with_config(config).with_backoff(backoff);
                                let request = CreateEmbeddingRequestArgs::default()
                                    .model(m)
                                    .input(text)
                                    .build()?;
                                let response = client.embeddings().create(request).await?;
                                let embedding: Vec<Vec<f32>> = response
                                    .data
                                    .iter()
                                    .map(|data| data.clone().embedding)
                                    .collect();
                                Ok(embedding)
                            }
                            None => {
                                Err(anyhow!("Credentials key was empty"))
                            }
                        }
                    }
                    Ok(None) => Err(anyhow!("Model credentials returned NONE")),
                    Err(e) => {
                        Err(anyhow!("Could not get OPEN AI model credentials, {:?}",e))
                    }
                }
            }
            None => Err(anyhow!("Model type is unknown")),
        },
    }
}


pub async fn embed_text_chunks_async(
    mongo_conn: Arc<RwLock<Database>>,
    datasource_id: String,
    table_chunks: Vec<String>,
    model: EmbeddingModels,
) -> Result<Vec<Vec<f32>>> {
    let mut list_of_embeddings: Vec<Vec<f32>> = vec![];

    let (tx, mut rx) = mpsc::channel(table_chunks.len()); // Channel with enough capacity

    for item in table_chunks {
        let tx = tx.clone(); // Clone the transmitter for each task
        let item = arc::new(item); // Use Arc to share ownership across tasks, avoiding cloning large data
        let mongo_conn_clone = Arc::clone(&mongo_conn);
        let datasource_clone = datasource_id.clone();
        task::spawn(async move {
            let processed_item = embed_text(
                mongo_conn_clone,
                datasource_clone,
                vec![&item],
                &model).await; // Process item asynchronously
            tx.send(processed_item)
                .await
                .expect("Failed to send processed item"); // Send back the result
        });
    }

    // Drop the original transmitter so the receiver knows when all tasks are done
    drop(tx);

    // Collect the results
    while let Some(processed_item) = rx.recv().await {
        if let Ok(embed) = processed_item {
            list_of_embeddings.push(embed[0].clone())
        }
    }

    Ok(list_of_embeddings)
}

