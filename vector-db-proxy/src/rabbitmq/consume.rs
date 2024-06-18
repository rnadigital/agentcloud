use std::sync::Arc;

use amqp_serde::types::ShortStr;
use amqprs::channel::{BasicAckArguments, BasicConsumeArguments, Channel};
use mongodb::Database;
use qdrant_client::client::QdrantClient;
use qdrant_client::prelude::PointStruct;
use serde_json::Value;
use tokio::sync::RwLock;

use crate::data::utils::{apply_chunking_strategy_to_document, extract_text_from_file};
use crate::llm::models::EmbeddingModels;
use crate::mongo::{models::ChunkingStrategy, queries::get_embedding_model};
use crate::mongo::queries::get_datasource;
use crate::qdrant::{helpers::construct_point_struct, utils::Qdrant};
use crate::queue::add_tasks_to_queues::add_message_to_embedding_queue;
use crate::queue::queuing::Pool;
use crate::utils::file_operations;
use crate::utils::file_operations::save_file_to_disk;
use crate::utils::webhook::send_webapp_embed_ready;

pub async fn subscribe_to_queue(
    // redis_connection_pool: Arc<Mutex<RedisConnection>>,
    qdrant_clone: Arc<RwLock<QdrantClient>>,
    queue: Arc<RwLock<Pool<String>>>,
    mongo_client: Arc<RwLock<Database>>,
    channel: &Channel,
    queue_name: &String,
) {
    let mongodb_connection = mongo_client.read().await;
    let args = BasicConsumeArguments::new(queue_name, "");
    let mut message_count: Vec<u8> = vec![];
    match channel.basic_consume_rx(args.clone()).await {
        Ok((_, mut messages_rx)) => {
            while let Some(message) = messages_rx.recv().await {
                let args = BasicAckArguments::new(message.deliver.unwrap().delivery_tag(), false);
                let _ = channel.basic_ack(args).await;
                let headers = message.basic_properties.unwrap().headers().unwrap().clone();
                if let Some(stream) = headers.get(&ShortStr::try_from("stream").unwrap()) {
                    message_count.push(1);
                    log::debug!("'{}' messages arrived at consume module", message_count.len());
                    let stream_string: String = stream.to_string();
                    let stream_split: Vec<&str> = stream_string.split('_').collect();
                    let datasource_id = stream_split.to_vec()[0];
                    if let Some(msg) = message.content {
                        // if the header 'type' is present then assume that it is a file upload. pull from gcs
                        if let Ok(message_string) = String::from_utf8(msg.clone().to_vec()) {
                            match get_datasource(&mongodb_connection, datasource_id).await {
                                Ok(datasource) => {
                                    if let Some(ds) = datasource {
                                        if let Ok(Some(model_parameters)) = get_embedding_model(&mongodb_connection, datasource_id).await {
                                            if headers.get(&ShortStr::try_from("type").unwrap()).is_some() {
                                                if let Ok(_json) = serde_json::from_str(message_string.as_str()) {
                                                    let message_data: Value = _json; // this is necessary because  you can not do type annotation inside a if let Ok() expression
                                                    match file_operations::read_file_from_source(headers, message_data).await {
                                                        Some((file_type, file, file_path)) => {
                                                            save_file_to_disk(file, file_path.as_str()).await.unwrap();
                                                            let message_queue = Arc::clone(&queue);
                                                            let qdrant_conn = Arc::clone(&qdrant_clone);
                                                            let mongo_conn = Arc::clone(&mongo_client);
                                                            // let redis_conn = Arc::clone(&redis_connection_pool);
                                                            let datasource_clone = ds.clone();
                                                            let (document_text, metadata) =
                                                                extract_text_from_file(file_type, file_path.as_str(), ds.originalName, datasource_id.to_string(), message_queue, qdrant_conn, mongo_conn).await.unwrap();
                                                            // dynamically get user's chunking strategy of choice from the database
                                                            let model_obj_clone = model_parameters.clone();
                                                            let model_name = model_obj_clone.model;
                                                            let chunking_character = datasource_clone.chunkCharacter;
                                                            let chunking_method = datasource_clone.chunkStrategy.unwrap();
                                                            let chunking_strategy = ChunkingStrategy::from(chunking_method);
                                                            let mongo_conn_clone = Arc::clone(&mongo_client);
                                                            match apply_chunking_strategy_to_document(document_text, metadata, chunking_strategy, chunking_character, Some(model_parameters.model), mongo_conn_clone, datasource_id.to_string())
                                                                .await {
                                                                Ok(chunks) => {
                                                                    let mut points_to_upload: Vec<PointStruct> = vec![];
                                                                    for element in chunks.iter() {
                                                                        let embedding_vector =
                                                                            &element.embedding_vector;
                                                                        match embedding_vector {
                                                                            Some(val) => {
                                                                                let model = EmbeddingModels::from(model_name.clone());
                                                                                if let Some(point_struct) = construct_point_struct(val, element.metadata.clone().unwrap(), Some(model)).await {
                                                                                    points_to_upload.push(point_struct)
                                                                                }
                                                                            }
                                                                            None => {
                                                                                log::warn!("Embedding vector was empty!")
                                                                            }
                                                                        }
                                                                    }
                                                                    let vector_length = model_parameters.embeddingLength as u64;
                                                                    let qdrant_conn_clone = Arc::clone(&qdrant_clone);
                                                                    let qdrant = Qdrant::new(qdrant_conn_clone, datasource_id.to_string());
                                                                    match qdrant.bulk_upsert_data(points_to_upload, Some(vector_length), Some(model_name)).await {
                                                                        Ok(_) => {
                                                                            log::debug!("points uploaded successfully!");
                                                                            if let Err(e) = send_webapp_embed_ready(&datasource_id).await {
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
                                                                Err(e) => log::error!("Error: {}", e),
                                                            }
                                                        }
                                                        None => {
                                                            log::warn!("Could not read file from source...source returned NONE!")
                                                        }
                                                    }
                                                }
                                            } else {
                                                // This is where data is coming from airbyte rather than a direct file upload
                                                let message_queue = Arc::clone(&queue);
                                                let qdrant_conn = Arc::clone(&qdrant_clone);
                                                let mongo_conn = Arc::clone(&mongo_client);
                                                let _ = add_message_to_embedding_queue(message_queue, qdrant_conn, mongo_conn, (datasource_id.to_string(), message_string)).await;
                                            }
                                        }
                                    } else {
                                        log::error!(
                                                "There was no embedding model associated with datasource: {}",
                                                datasource_id
                                            )
                                    }
                                }
                                Err(e) => { log::error!("Could not find associated datasource: {}", e) }
                            }
                        }
                    } else {
                        log::warn!("There was no stream_id in message... can not upload data!");
                    }
                }
            }
        }
        Err(e) => { log::error!("Error consuming message from rabbit: {}", e) }
    }
}
