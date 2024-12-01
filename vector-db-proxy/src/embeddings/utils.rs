use crate::adaptors::mongo::models::{DataSources, Model};
use crate::adaptors::mongo::queries::increment_by_one;
use crate::data::unstructuredio::models::UnstructuredIOResponse;
use crate::embeddings::helpers::clean_text;
use crate::embeddings::models::{EmbeddingModels, FastEmbedModels};
use crate::init::env_variables::GLOBAL_DATA;
use crate::vector_databases::helpers::check_byo_vector_database;
use crate::vector_databases::models::{Point, SearchRequest, SearchType, VectorDatabaseStatus};
use crate::vector_databases::vector_database::default_vector_db_client;
use anyhow::{anyhow, Result};
use async_openai::config::OpenAIConfig;
use async_openai::types::CreateEmbeddingRequestArgs;
use fastembed::{EmbeddingBase, FlagEmbedding, InitOptions};
use mongodb::Database;
use ort::{
    CUDAExecutionProvider, CoreMLExecutionProvider, ExecutionProvider, ExecutionProviderDispatch,
    ROCmExecutionProvider,
};
use serde_json::Value;
use std::collections::HashMap;
use std::sync::Arc as arc;
use std::sync::Arc;
use tokio::sync::mpsc;
use tokio::sync::RwLock;
use tokio::task;
use uuid::Uuid;

async fn fastembed_models(
    model: &FastEmbedModels,
    use_gpu: &str,
    text: Vec<&String>,
) -> Result<Vec<Vec<f32>>> {
    match FastEmbedModels::translate(&model) {
        Some(translation) => match use_gpu {
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
                                execution_providers: vec![ExecutionProviderDispatch::CoreML(
                                    coreml,
                                )],
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
                                        let model: FlagEmbedding =
                                            FlagEmbedding::try_new(InitOptions {
                                                model_name: translation,
                                                show_download_message: true,
                                                execution_providers: vec![
                                                    ExecutionProviderDispatch::CUDA(cuda),
                                                ],
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
                                Err(e) => Err(anyhow!(
                                    "Error occurred while looking for CUDA hardware: {}",
                                    e
                                )),
                            }
                        }
                    }
                    Err(e) => Err(anyhow!(
                        "An error occurred while looking for CoreML hardware: {}",
                        e
                    )),
                }
            }
        },
        None => Err(anyhow!(
            "Model does not match any known fast embed model variants"
        )),
    }
}

pub async fn embed_text(text: Vec<&String>, model: &Model) -> Result<Vec<Vec<f32>>> {
    let model_name = model.clone().model;
    match EmbeddingModels::from(model_name.clone()) {
        EmbeddingModels::UNKNOWN => Err(anyhow!("This is an unknown model type!")),
        // Group all fast embed models together
        EmbeddingModels::BAAI_BGE_SMALL_EN
        | EmbeddingModels::BAAI_BGE_SMALL_EN_V1_5
        | EmbeddingModels::BAAI_BGE_BASE_EN
        | EmbeddingModels::BAAI_BGE_BASE_EN_V1_5
        | EmbeddingModels::ENTENCE_TRANSFORMERS_ALL_MINILM_L6_V2
        | EmbeddingModels::XENOVA_FAST_MULTILINGUAL_E5_LARGE => {
            let global_data = GLOBAL_DATA.read().await;
            let model = FastEmbedModels::from(model_name);
            fastembed_models(&model, global_data.use_gpu.as_str(), text).await
        }
        // Assume OAI models for now...
        _ => {
            let model_clone = model.clone();
            // initiate variables
            let backoff = backoff::ExponentialBackoffBuilder::new()
                .with_max_elapsed_time(Some(std::time::Duration::from_secs(60)))
                .build();
            if let Some(api_key) = model_clone.config.api_key {
                let mut config = OpenAIConfig::new().with_api_key(api_key);
                if let Some(org_id) = model_clone.config.org_id {
                    config = config.with_org_id(org_id)
                }
                let client = async_openai::Client::with_config(config).with_backoff(backoff);
                let request = CreateEmbeddingRequestArgs::default()
                    .model(model_name.clone())
                    .input(text)
                    .build()?;
                let response = client.embeddings().create(request).await?;
                let embedding: Vec<Vec<f32>> = response
                    .data
                    .iter()
                    .map(|data| data.clone().embedding)
                    .collect();
                Ok(embedding)
            } else {
                Err(anyhow!("Model missing api key"))
            }
        }
    }
}

pub async fn embed_text_chunks_async(
    table_chunks: Vec<String>,
    model: &Model,
) -> Result<Vec<Vec<f32>>> {
    let mut list_of_embeddings: Vec<Vec<f32>> = vec![];

    let (tx, mut rx) = mpsc::channel(table_chunks.len()); // Channel with enough capacity

    for item in table_chunks {
        let tx = tx.clone(); // Clone the transmitter for each task
        let item = arc::new(item); // Use Arc to share ownership across tasks, avoiding cloning large data
        let model_clone = model.clone();
        task::spawn(async move {
            tx.send(embed_text(vec![&item], &model_clone).await)
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

pub async fn embed_bulk_insert_unstructured_response(
    documents: Vec<UnstructuredIOResponse>,
    datasource: DataSources,
    mongo_client: Arc<RwLock<Database>>,
    embedding_model: Model,
    metadata: Option<HashMap<String, Value>>,
    search_type: SearchType,
) {
    let mongo_connection = mongo_client.read().await;
    let list_of_text: Vec<String> = documents.iter().map(|doc| doc.text.clone()).collect();
    let datasource_id = datasource.id.to_string();
    match embed_text_chunks_async(list_of_text.clone(), &embedding_model).await {
        Ok(embeddings) => {
            let mut search_request = SearchRequest::new(
                search_type.clone(),
                datasource
                    .collection_name
                    .clone()
                    .unwrap_or(datasource_id.clone()),
            );
            search_request.byo_vector_db = Some(true);
            search_request.namespace = datasource.namespace.clone();
            let mut points_to_upload: Vec<Point> = vec![];

            for (i, document) in documents.iter().enumerate() {
                let mut point_metadata: HashMap<String, Value> = HashMap::new();

                point_metadata.insert(
                    "page_content".to_string(),
                    Value::String(clean_text(document.text.clone())),
                );

                if let Ok(Value::Object(map)) = serde_json::to_value(document.metadata.clone()) {
                    for (key, value) in map {
                        point_metadata.insert(key, value);
                    }
                }

                // Add any additional metadata passed in
                if let Some(existing_metadata) = metadata.clone() {
                    point_metadata.extend(existing_metadata);
                }

                let embedding_vector = embeddings.get(i);
                if let Some(vector) = embedding_vector {
                    let point = Point::new(
                        point_metadata.get("index").map_or_else(
                            || Some(Value::String(Uuid::new_v4().to_string())),
                            |id| match id {
                                Value::String(s) => Some(Value::String(s.clone())),
                                _ => Some(Value::String(
                                    id.to_string().trim_matches('"').to_string(),
                                )),
                            },
                        ),
                        vector.to_vec(),
                        Some(point_metadata),
                    );
                    points_to_upload.push(point)
                }
            }

            let vector_database_client =
                check_byo_vector_database(datasource.clone(), &mongo_connection)
                    .await
                    .unwrap_or(default_vector_db_client().await);

            let vector_database = Arc::clone(&vector_database_client);
            let vector_database_client = vector_database.read().await;

            if let Ok(bulk_insert_status) = vector_database_client
                .bulk_insert_points(search_request.clone(), points_to_upload)
                .await
            {
                match bulk_insert_status {
                    VectorDatabaseStatus::Ok => {
                        log::debug!("points uploaded successfully!");

                        increment_by_one(&mongo_connection, &datasource_id, "recordCount.success")
                            .await
                            .unwrap();
                    }
                    VectorDatabaseStatus::Failure | VectorDatabaseStatus::NotFound => {
                        increment_by_one(&mongo_connection, &datasource_id, "recordCount.failure")
                            .await
                            .unwrap();
                        log::warn!("Could not find collection :{}", datasource_id);
                    }
                    VectorDatabaseStatus::Error(e) => {
                        increment_by_one(&mongo_connection, &datasource_id, "recordCount.failure")
                            .await
                            .unwrap();
                        log::error!(
                            "An error occurred while attempting point insert operation. Error: {:?}",
                            e
                        )
                    }
                }
            }
        }
        Err(e) => log::error!("An error occurred while embedding text. Error: {}", e),
    }
}
