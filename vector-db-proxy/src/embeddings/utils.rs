use anyhow::{anyhow, Result};
use async_openai::config::OpenAIConfig;
use async_openai::types::CreateEmbeddingRequestArgs;
use fastembed::{EmbeddingBase, FlagEmbedding, InitOptions};
use mongodb::Database;
use ort::{
    CUDAExecutionProvider, CoreMLExecutionProvider, ExecutionProvider, ExecutionProviderDispatch,
    ROCmExecutionProvider,
};
use std::collections::HashMap;
use std::sync::Arc as arc;
use std::sync::Arc;
use tokio::sync::mpsc;
use tokio::sync::RwLock;
use tokio::task;

use crate::adaptors::mongo::queries::{get_model, increment_by_one};
use crate::data::unstructuredio::models::UnstructuredIOResponse;
use crate::embeddings::models::{EmbeddingModels, FastEmbedModels};
use crate::init::env_variables::GLOBAL_DATA;
use crate::vector_databases::models::{Point, SearchRequest, SearchType, VectorDatabaseStatus};
use crate::vector_databases::vector_database::VectorDatabase;

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
                fastembed_models(&model, global_data.use_gpu.as_str(), text).await
            }
            None => Err(anyhow!("Model type unknown")),
        },

        // Assume OAI models for now...
        _ => match model.to_str() {
            Some(m) => {
                // initiate variables
                let mongodb_connection = mongo_conn.read().await;
                match get_model(&mongodb_connection, datasource_id.as_str()).await {
                    Ok(model) => {
                        if let Some(model_obj) = model {
                            let backoff = backoff::ExponentialBackoffBuilder::new()
                                .with_max_elapsed_time(Some(std::time::Duration::from_secs(60)))
                                .build();
                            if let Some(api_key) = model_obj.config.api_key {
                                let mut config = OpenAIConfig::new().with_api_key(api_key);
                                if let Some(org_id) = model_obj.config.org_id {
                                    config = config.with_org_id(org_id)
                                }
                                let client =
                                    async_openai::Client::with_config(config).with_backoff(backoff);
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
                            } else {
                                Err(anyhow!("Model missing api key"))
                            }
                        } else {
                            Err(anyhow!("Model not returned"))
                        }
                    }
                    Err(e) => Err(anyhow!("Could not get OPEN AI model credentials, {:?}", e)),
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
            let processed_item =
                embed_text(mongo_conn_clone, datasource_clone, vec![&item], &model).await; // Process item asynchronously
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

pub async fn embed_bulk_insert_unstructured_response(
    documents: Vec<UnstructuredIOResponse>,
    datasource_id: String,
    vector_database_client: Arc<RwLock<dyn VectorDatabase>>,
    mongo_client: Arc<RwLock<Database>>,
    embedding_model: EmbeddingModels,
    metadata: Option<HashMap<String, String>>,
    search_type: SearchType,
) {
    let mongo_connection = mongo_client.read().await;
    // Construct a collection of the texts from the
    // Unstructured IO response to embed
    let list_of_text: Vec<String> = documents.iter().map(|doc| doc.text.clone()).collect();
    match embed_text_chunks_async(
        mongo_client.clone(),
        datasource_id.to_string(),
        list_of_text.clone(),
        embedding_model,
    )
    .await
    {
        Ok(embeddings) => {
            // Initialise vector database client
            let vector_database = Arc::clone(&vector_database_client);
            let vector_database_client = vector_database.read().await;
            let mut points_to_upload: Vec<Point> = vec![];
            // Construct point to upload
            for i in 0..list_of_text.len() {
                // Construct metadata hashmap
                let file_metadata = documents.get(i).unwrap();
                let mut metadata_map = HashMap::from(file_metadata);
                if let Some(existing_metadata) = metadata.clone() {
                    metadata_map.extend(existing_metadata)
                }
                // Embed text and return vector
                let embedding_vector = embeddings.get(i);
                if let Some(vector) = embedding_vector {
                    let point = Point::new(
                        Some(metadata_map.get("index").unwrap().to_owned()),
                        vector.to_vec(),
                        Some(metadata_map),
                    );
                    points_to_upload.push(point)
                }
                let search_request =
                    SearchRequest::new(search_type.clone(), datasource_id.to_string());

                //Attempt vector database insert
                if let Ok(bulk_insert_status) = vector_database_client
                    .bulk_insert_points(search_request, points_to_upload.clone())
                    .await
                {
                    match bulk_insert_status {
                        VectorDatabaseStatus::Ok => {
                            log::debug!("points uploaded successfully!");
                        }
                        VectorDatabaseStatus::Failure | VectorDatabaseStatus::NotFound => {
                            increment_by_one(
                                &mongo_connection,
                                datasource_id.as_str(),
                                "recordCount.failure",
                            )
                            .await
                            .unwrap();
                            log::warn!("Could not find collection :{}", datasource_id);
                        }
                        VectorDatabaseStatus::Error(e) => {
                            increment_by_one(
                                &mongo_connection,
                                datasource_id.as_str(),
                                "recordCount.failure",
                            )
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
        }
        Err(e) => log::error!("An error occurred while embedding text. Error: {}", e),
    }
}
