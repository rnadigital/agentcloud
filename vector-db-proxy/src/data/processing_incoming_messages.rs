use mongodb::Database;
use std::sync::Arc;
use crossbeam::channel::Receiver;
use tokio::sync::{RwLock};
use qdrant_client::client::QdrantClient;
use serde_json::Value;
use std::thread::available_parallelism;

use crate::llm::models::EmbeddingModels;
use crate::mongo::queries::{get_embedding_model_and_embedding_key, increment_by_one};
use crate::qdrant::helpers::embed_payload;
use crate::qdrant::utils::Qdrant;
use crate::utils::conversions::convert_serde_value_to_hashmap_string;

pub async fn process_incoming_messages(
    receiver: Arc<RwLock<Receiver<(String, String)>>>,
    qdrant_conn: Arc<RwLock<QdrantClient>>,
    mongo_conn: Arc<RwLock<Database>>,
) {
    println!("processing incoming messages");
    let number_of_workers = available_parallelism()
        .map(|t| t.get() as u64)
        .unwrap_or(12);
    for _ in 0..number_of_workers {
        let mongo_connection = Arc::clone(&mongo_conn);
        let qdrant_connection = Arc::clone(&qdrant_conn);
        let receiver_clone = receiver.clone();
        tokio::spawn(async move {
            while let Ok(msg) = receiver_clone.read().await.recv() {
                let (datasource_id, message) = msg;
                match serde_json::from_str(message.as_str()) {
                    Ok::<Value, _>(message_data) => {
                        let mongo = mongo_connection.read().await;
                        match get_embedding_model_and_embedding_key(&mongo, datasource_id.as_str())
                            .await
                        {
                            Ok((model_parameter_result, embedding_field)) => match model_parameter_result {
                                Some(model_parameters) => {
                                    let embedding_model_name = model_parameters.model;
                                    let ds_clone = datasource_id.clone();
                                    let qdrant = Qdrant::new(qdrant_connection.clone(), datasource_id);
                                    let mut field_path = "recordCount.failure";
                                    if let Value::Object(mut data_obj) = message_data {
                                        // This is to account for airbyte sending the data in the _airbyte_data object when the destination is PubSub
                                        if let Some(is_pubsub) = data_obj.get("_airbyte_data") {
                                            if let Some(pubsub_is_obj) = is_pubsub.as_object() {
                                                data_obj = pubsub_is_obj.to_owned();
                                            }
                                        }
                                        let mut metadata = convert_serde_value_to_hashmap_string(data_obj.to_owned());
                                        if let Some(text_field) = embedding_field {
                                            match metadata.remove(text_field.to_lowercase().as_str()) {
                                                Some(t) => {
                                                    metadata.insert("page_content".to_string(), t.to_owned());
                                                    let ds_clone = ds_clone.clone();
                                                    match embed_payload(
                                                        mongo_connection.clone(),
                                                        &metadata,
                                                        &t,
                                                        Some(ds_clone.clone()),
                                                        EmbeddingModels::from(embedding_model_name)).await {
                                                        Ok(point_struct) => {
                                                            match qdrant.upsert_data_point_blocking(point_struct).await {
                                                                Ok(result) => {
                                                                    match result {
                                                                        true => {
                                                                            field_path = "recordCount.success";
                                                                            increment_by_one(&mongo, &ds_clone, field_path).await.unwrap();
                                                                        }
                                                                        false => {
                                                                            log::warn!("An error occurred while inserting into vector database");
                                                                            increment_by_one(&mongo, &ds_clone, field_path).await.unwrap();
                                                                        }
                                                                    }
                                                                }
                                                                Err(e) => {
                                                                    log::warn!("An error occurred while inserting into vector database. Error: {}", e);
                                                                    increment_by_one(&mongo, &ds_clone, field_path).await.unwrap();
                                                                }
                                                            }
                                                            increment_by_one(&mongo, &ds_clone, field_path).await.unwrap();
                                                        }
                                                        Err(e) => {
                                                            increment_by_one(&mongo, &ds_clone, field_path).await.unwrap();
                                                            log::error!("An error occurred while upserting  point structs to Qdrant: {}", e);
                                                        }
                                                    }
                                                }
                                                None => {
                                                    log::error!("The text field {} returned None!", text_field)
                                                }
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
                        log::error!(
                                "An error occurred while attempting to convert message to JSON: {}",
                                e
                            );
                    }
                }
            }
        });
    }
}
