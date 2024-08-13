use crate::adaptors::gcp::models::PubSubConnect;
use crate::adaptors::mongo::models::ChunkingStrategy;
use crate::adaptors::mongo::queries::{get_datasource, get_model};
use crate::adaptors::qdrant::helpers::construct_point_struct;
use crate::adaptors::qdrant::utils::Qdrant;
use crate::adaptors::rabbitmq::models::RabbitConnect;
use crate::data::unstructuredio::apis::chunk_text;
use crate::embeddings::models::EmbeddingModels;
use crate::embeddings::utils::embed_text_chunks_async;
use crate::init::env_variables::GLOBAL_DATA;
use crate::messages::models::{MessageQueueConnection, MessageQueueProvider, QueueConnectionTypes};
use crate::messages::task_handoff::send_task;
use crate::utils::file_operations;
use crate::utils::file_operations::save_file_to_disk;
use crate::utils::webhook::send_webapp_embed_ready;
use crossbeam::channel::Sender;
use mongodb::Database;
use qdrant_client::client::QdrantClient;
use qdrant_client::prelude::PointStruct;
use serde_json::Value;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

pub async fn get_message_queue(
    message_queue_provider: MessageQueueProvider,
) -> QueueConnectionTypes {
    let global_data = GLOBAL_DATA.read().await;
    match message_queue_provider {
        MessageQueueProvider::RABBITMQ => {
            println!("Using RabbitMQ as the streaming Queue!");
            let rabbitmq_connection = RabbitConnect {
                host: global_data.rabbitmq_host.clone(),
                port: global_data.rabbitmq_port,
                username: global_data.rabbitmq_username.clone(),
                password: global_data.rabbitmq_password.clone(),
            };
            rabbitmq_connection.connect().await.unwrap()
        }
        MessageQueueProvider::PUBSUB => {
            println!("Using PubSub as the streaming Queue!");
            let pubsub_connection = PubSubConnect {
                topic: global_data.rabbitmq_stream.clone(),
                subscription: global_data.rabbitmq_stream.clone(),
            };
            pubsub_connection.connect().await.unwrap()
        }
        MessageQueueProvider::UNKNOWN => {
            panic!("Unknown message Queue provider specified. Aborting application!");
        }
    }
}

pub async fn process_message(message_string: String, stream_type: Option<String>, datasource_id: &str, qdrant_client: Arc<RwLock<QdrantClient>>, mongo_client: Arc<RwLock<Database>>, sender: Sender<(String, String)>) {
    let mongodb_connection = mongo_client.read().await;
    let global_data = GLOBAL_DATA.read().await.clone();
    match get_datasource(&mongodb_connection, datasource_id).await {
        Ok(datasource) => {
            if let Some(ds) = datasource {
                if let Ok(Some(model_parameters)) = get_model(&mongodb_connection, datasource_id).await {
                    if let Some(stream_type) = stream_type {
                        if let Ok(_json) = serde_json::from_str(message_string.as_str()) {
                            let message_data: Value = _json; // this is necessary because  you can not do type annotation inside a if let Ok() expression
                            match file_operations::read_file_from_source(Some(stream_type.to_string()), message_data).await {
                                Some((_, file, file_path)) => {
                                    save_file_to_disk(file, file_path.as_str()).await.unwrap();
                                    let unstructuredio_url = global_data.unstructuredio_url;
                                    let unstructuredio_api_key = Some(global_data.unstructuredio_api_key).filter(|s| !s.is_empty());
                                    let handle = tokio::task::spawn_blocking(move || {
                                        let response = chunk_text(
                                            unstructuredio_url,
                                            unstructuredio_api_key,
                                            file_path.as_str(),
                                        );
                                        response
                                    });
                                    let datasource_clone = ds.clone();
                                    // dynamically get user's chunking strategy of choice from the database
                                    let model_obj_clone = model_parameters.clone();
                                    let model_name = EmbeddingModels::from(model_obj_clone.model);
                                    let chunking_method = datasource_clone.chunkStrategy.unwrap();
                                    let _chunking_strategy = ChunkingStrategy::from(chunking_method);
                                    let mongo_connection_clone = Arc::clone(&mongo_client);
                                    match handle.await.unwrap() {
                                        Ok(documents) => {
                                            // Construct a collection of the texts from the 
                                            // Unstructured IO response to embed
                                            let list_of_text: Vec<String> = documents
                                                .iter()
                                                .map(|doc| doc.text.clone())
                                                .collect();
                                            match embed_text_chunks_async(
                                                mongo_connection_clone,
                                                datasource_id.to_string(),
                                                list_of_text.clone(),
                                                EmbeddingModels::from(model_name),
                                            ).await {
                                                Ok(embeddings) => {
                                                    let mut points_to_upload: Vec<PointStruct> = vec![];
                                                    for i in 0..list_of_text.len() {
                                                        let file_metadata = documents.get(i)
                                                            .unwrap();
                                                        let metadata_map =
                                                            HashMap::from(file_metadata);
                                                        let embedding_vector = embeddings.get(i);
                                                        if let Some(vector) = embedding_vector {
                                                            if let Some(point_struct) =
                                                                construct_point_struct(
                                                                    &vector,
                                                                    metadata_map,
                                                                    Some(model_name.clone()),
                                                                ).await { points_to_upload.push(point_struct) };
                                                        }
                                                        let vector_length = model_parameters.embeddingLength as u64;
                                                        let qdrant_conn_clone = Arc::clone(&qdrant_client);
                                                        let qdrant = Qdrant::new(qdrant_conn_clone, datasource_id.to_string());
                                                        match qdrant.bulk_upsert_data(
                                                            points_to_upload.clone(),
                                                            Some(vector_length),
                                                            Some(model_name.to_str().unwrap().to_string()),
                                                        ).await {
                                                            Ok(_) => {
                                                                log::debug!("points uploaded successfully!");
                                                                if let Err(e) = send_webapp_embed_ready(datasource_id).await {
                                                                    log::error!("Error notifying webapp: {}", e);
                                                                } else {
                                                                    log::info!("Webapp notified successfully!");
                                                                }
                                                            }
                                                            Err(e) => {
                                                                log::error!("An error occurred while attempting upload to qdrant. Error: {:?}", e);
                                                            }
                                                        }
                                                    }
                                                },
                                                Err(e) => log::error!("An error occurred while \
                                                embedding text. Error: {}", e)
                                            }
                                        }
                                        Err(e) => log::error!("An error occurred while retrieving 
                                         results from Unstructured IO response. Error : {}",e)
                                        }
                                }
                                None => {
                                    log::warn!("Could not read file from source...source returned NONE!")
                                }
                            }
                        }
                    } else {
                        // This is where data is coming from airbyte rather than a direct file upload
                        let _ = send_task(sender, (datasource_id.to_string(), message_string)).await;
                    }
                }
            } else {
                log::error!("There was no embedding model associated with datasource: {}", datasource_id)
            }
        }
        Err(e) => { log::error!("Could not find associated datasource: {}", e) }
    }
} 