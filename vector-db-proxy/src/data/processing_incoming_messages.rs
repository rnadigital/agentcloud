use crossbeam::channel::Receiver;
use mongodb::Database;
use qdrant_client::client::QdrantClient;
use serde_json::Value;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::adaptors::mongo::queries::{get_model_and_embedding_key, increment_by_one};
use crate::adaptors::qdrant::helpers::embed_payload;
use crate::adaptors::qdrant::utils::Qdrant;
use crate::embeddings::models::EmbeddingModels;
use crate::utils::conversions::convert_serde_value_to_hashmap_string;

async fn handle_embedding(
    mongo_connection: Arc<RwLock<Database>>,
    qdrant: Arc<RwLock<QdrantClient>>,
    metadata: HashMap<String, String>,
    embedding_field_name: String,
    datasource_id: String,
    embedding_model_name: String,
) {
    let mongo_connection_clone = Arc::clone(&mongo_connection);
    let qdrant_connection_clone = Arc::clone(&qdrant);
    let metadata = metadata.clone();
    let datasource_id_clone = datasource_id.clone();
    let datasource_id_clone_2 = datasource_id.clone();
    let mut field_path = "recordCount.failure";
    let mongo = mongo_connection_clone.read().await;
    let qdrant = Qdrant::new(qdrant_connection_clone, datasource_id);
    match embed_payload(
        mongo_connection.clone(),
        &metadata,
        &embedding_field_name,
        Some(datasource_id_clone),
        EmbeddingModels::from(embedding_model_name)).await {
        Ok(point_struct) => {
            match qdrant.upsert_data_points(point_struct).await {
                Ok(result) => {
                    match result {
                        true => {
                            field_path = "recordCount.success";
                            increment_by_one(&mongo, &datasource_id_clone_2, field_path).await.unwrap();
                        }
                        false => {
                            log::warn!("An error occurred while inserting into vector database");
                            increment_by_one(&mongo, &datasource_id_clone_2, field_path).await.unwrap();
                        }
                    }
                }
                Err(e) => {
                    log::warn!("An error occurred while inserting into vector database. Error: {}", e);
                    increment_by_one(&mongo, &datasource_id_clone_2, field_path).await.unwrap();
                }
            }
        }
        Err(e) => {
            increment_by_one(&mongo, &datasource_id_clone_2, field_path).await.unwrap();
            log::error!("An error occurred while upserting  point structs to Qdrant: {}", e);
        }
    }
}


pub async fn process_incoming_messages(
    receiver: Receiver<(String, String)>,
    qdrant_conn: Arc<RwLock<QdrantClient>>,
    mongo_conn: Arc<RwLock<Database>>,
) {
    let mongo_connection = Arc::clone(&mongo_conn);
    let receiver_clone = receiver.clone();
    while let Ok(msg) = receiver_clone.recv() {
        let (datasource_id, message) = msg;
        match serde_json::from_str(message.as_str()) {
            Ok::<Value, _>(message_data) => {
                let mongo = mongo_connection.read().await;
                match get_model_and_embedding_key(&mongo, datasource_id.as_str())
                    .await
                {
                    Ok((model_parameter_result, embedding_field)) => match model_parameter_result {
                        Some(model_parameters) => {
                            let embedding_model_name = model_parameters.model;
                            let datasources_clone = datasource_id.clone();
                            if let Value::Object(mut data_obj) = message_data {
                                // This is to account for airbyte sending the data in the _airbyte_data object when the destination is PubSub
                                if let Some(is_pubsub) = data_obj.get("_airbyte_data") {
                                    if let Some(pubsub_is_obj) = is_pubsub.as_object() {
                                        data_obj = pubsub_is_obj.to_owned();
                                    }
                                }
                                let metadata = convert_serde_value_to_hashmap_string(data_obj.to_owned());
                                if let Some(embedding_field_name) = embedding_field {
                                    let mongo_connection_clone = Arc::clone(&mongo_connection);
                                    let qdrant_connection_clone = Arc::clone(&qdrant_conn);
                                    let embed_text_worker = tokio::spawn(async move {
                                        let _ = handle_embedding(
                                            mongo_connection_clone,
                                            qdrant_connection_clone,
                                            metadata,
                                            embedding_field_name,
                                            datasources_clone,
                                            embedding_model_name,
                                        ).await;
                                    });
                                    tokio::select! {
                                        _ = embed_text_worker => log::info!("Finished embedding task")
                                    }
                                }
                            }
                        }
                        None => {
                            log::error!("Model mongo object returned None!");
                        }
                    },
                    Err(e) => {
                        log::error!("An error occurred: {}", e);
                    }
                }
            }
            Err(e) => {
                log::error!("An error occurred while attempting to convert message to JSON: {}",e);
            }
        }
    }
}
