use mongodb::Database;
use std::sync::Arc;
use tokio::sync::{RwLock};
use qdrant_client::client::QdrantClient;
use serde_json::Value;

use crate::llm::models::EmbeddingModels;
use crate::mongo::queries::get_embedding_model_and_embedding_key;
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
    // let redis_connection = redis_connection_pool.lock().await;
    match serde_json::from_str(message.as_str()) {
        Ok::<Value, _>(message_data) => {
            match get_embedding_model_and_embedding_key(&mongodb_connection, datasource_id.as_str())
                .await
            {
                Ok((model_parameter_result, embedding_field)) => match model_parameter_result {
                    Some(model_parameters) => {
                        let embedding_model_name = model_parameters.model;
                        let ds_clone = datasource_id.clone();
                        let qdrant = Qdrant::new(qdrant_conn, datasource_id);
                        if let Value::Object(data_obj) = message_data {
                            let mut metadata = convert_serde_value_to_hashmap_string(data_obj);
                            if let Some(text_field) = embedding_field {
                                println!("text field: {}", text_field.as_str());
                                let text = metadata.remove(text_field.as_str()).unwrap();
                                metadata.insert("page_content".to_string(), text.to_owned());
                                let mongo_conn_clone = Arc::clone(&mongo_conn);
                                match embed_payload(
                                    mongo_conn_clone,
                                    &metadata,
                                    &text,
                                    Some(ds_clone),
                                    EmbeddingModels::from(embedding_model_name)).await {
                                    Ok(point_struct) => {
                                        let _ = qdrant.upsert_data_point_blocking(point_struct).await;
                                    }
                                    Err(e) => {
                                        eprintln!("An error occurred while upserting  point structs to Qdrant: {}", e);
                                    }
                                }
                            }
                        }
                    }
                    None => {
                        eprintln!("Model mongo object returned None!");
                    }
                },
                Err(e) => {
                    println!("An error occurred: {}", e);
                }
            }
        }
        Err(e) => {
            eprintln!(
                "An error occurred while attempting to convert message to JSON: {}",
                e
            );
        }
    }
}
