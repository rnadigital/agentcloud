use mongodb::Database;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::llm::models::EmbeddingModels;
use crate::mongo::queries::get_embedding_model;
use crate::qdrant::helpers::embed_payload;
use crate::qdrant::utils::Qdrant;
use crate::utils::conversions::convert_serde_value_to_hashmap_string;
use qdrant_client::client::QdrantClient;
use serde_json::{json, Value};

pub async fn process_messages(
    qdrant_conn: Arc<RwLock<QdrantClient>>,
    mongo_conn: Arc<RwLock<Database>>,
    message: String,
    datasource_id: String,
) -> bool {
    // initiate variables
    let mongodb_connection = mongo_conn.read().await;
    let mut message_data: Value = json!({});
    match serde_json::from_str(message.as_str()) {
        Ok(_json) => {
            message_data = _json;
            match get_embedding_model(&mongodb_connection, datasource_id.as_str()).await {
                Ok((model_parameter_result, embedding_field)) => match model_parameter_result {
                    Some(model_parameters) => {
                        let vector_length = model_parameters.embeddingLength as u64;
                        let embedding_model_name = model_parameters.model;
                        let embedding_model_name_clone = embedding_model_name.clone();
                        let ds_clone = datasource_id.clone();
                        let qdrant = Qdrant::new(qdrant_conn, datasource_id);
                        let message_clone = message_data.clone();
                        if let Value::Object(data_obj) = message_data {
                            let metadata = convert_serde_value_to_hashmap_string(data_obj);
                            if let Some(text_field) = embedding_field {
                                let text = message_clone
                                    .get(text_field)
                                    .unwrap_or(&Value::String("".to_string()))
                                    .to_string();
                                match embed_payload(
                                    &metadata,
                                    text,
                                    Some(ds_clone),
                                    EmbeddingModels::from(embedding_model_name),
                                )
                                .await
                                {
                                    Ok(point_struct) => {
                                        if let Ok(bulk_upload_result) = qdrant
                                            .bulk_upsert_data(
                                                vec![point_struct],
                                                Some(vector_length),
                                                Some(embedding_model_name_clone),
                                            )
                                            .await
                                        {
                                            return bulk_upload_result;
                                        }
                                    }
                                    Err(e) => {
                                        eprintln!("An error occurred while upserting  point structs to Qdrant: {}", e);
                                        return false;
                                    }
                                }
                            }
                        } else {
                            return false;
                        }
                    }
                    None => {
                        eprintln!("Model mongo object returned None!");
                        return false;
                    }
                },
                Err(e) => {
                    println!("An error occurred: {}", e);
                    return false;
                }
            }
            false
        }
        Err(e) => {
            eprintln!(
                "An error occurred while attempting to convert message to JSON: {}",
                e
            );
            false
        }
    }
}
