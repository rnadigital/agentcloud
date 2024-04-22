use mongodb::Database;
use std::sync::Arc;
use tokio::sync::{RwLock};
use qdrant_client::client::QdrantClient;
use serde_json::Value;

use crate::llm::models::EmbeddingModels;
use crate::mongo::queries::{get_embedding_model_and_embedding_key, increment_by_one};
use crate::qdrant::helpers::embed_payload;
use crate::qdrant::utils::Qdrant;
use crate::utils::conversions::convert_serde_value_to_hashmap_string;

pub async fn process_messages(
    qdrant_conn: Arc<RwLock<QdrantClient>>,
    mongo_conn: Arc<RwLock<Database>>,
    message: String,
    datasource_id: String,
) {
    // initiate variables
    let mongodb_connection = mongo_conn.read().await;
    let mut message_count: Vec<u8> = vec![];
    match serde_json::from_str(message.as_str()) {
        Ok::<Value, _>(message_data) => {
            message_count.push(1);
            log::debug!("'{}' messages arrived at process_messages module", message_count.len());
            match get_embedding_model_and_embedding_key(&mongodb_connection, datasource_id.as_str())
                .await
            {
                Ok((model_parameter_result, embedding_field)) => match model_parameter_result {
                    Some(model_parameters) => {
                        let embedding_model_name = model_parameters.model;
                        let ds_clone = datasource_id.clone();
                        let qdrant = Qdrant::new(qdrant_conn, datasource_id);
                        let mut field_path = "recordCount.failure";
                        if let Value::Object(data_obj) = message_data {
                            let mut metadata = convert_serde_value_to_hashmap_string(data_obj);
                            if let Some(text_field) = embedding_field {
                                log::debug!("text field: {}", text_field.as_str());
                                let text = metadata.remove(text_field.as_str()).unwrap();
                                metadata.insert("page_content".to_string(), text.to_owned());
                                let mongo_conn_clone = Arc::clone(&mongo_conn);
                                let ds_clone = ds_clone.clone();
                                match embed_payload(
                                    mongo_conn_clone,
                                    &metadata,
                                    &text,
                                    Some(ds_clone.clone()),
                                    EmbeddingModels::from(embedding_model_name)).await {
                                    Ok(point_struct) => {
                                        match qdrant.upsert_data_point_blocking(point_struct).await {
                                            Ok(result) => {
                                                match result {
                                                    true => {
                                                        field_path = "recordCount.success";
                                                        let _ = increment_by_one(&mongodb_connection, &*ds_clone, field_path).await.unwrap();
                                                    }
                                                    false => {
                                                        log::warn!("An error occurred while inserting into vector database");
                                                        let _ = increment_by_one(&mongodb_connection, &*ds_clone, field_path).await.unwrap();
                                                    }
                                                }
                                            }
                                            Err(e) => {
                                                log::warn!("An error occurred while inserting into vector database. Error: {}", e);
                                                let _ = increment_by_one(&mongodb_connection, &*ds_clone, field_path).await.unwrap();
                                            }
                                        }
                                        let _ = increment_by_one(&mongodb_connection, &*ds_clone, field_path).await.unwrap();
                                    }
                                    Err(e) => {
                                        let _ = increment_by_one(&mongodb_connection, &*ds_clone, field_path).await.unwrap();
                                        log::error!("An error occurred while upserting  point structs to Qdrant: {}", e);
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
