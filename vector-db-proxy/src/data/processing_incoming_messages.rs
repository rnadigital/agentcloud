use mongodb::Database;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::llm::models::EmbeddingModels;
use crate::mongo::queries::get_embedding_model;
use crate::qdrant::helpers::embed_table_chunks_async;
use crate::qdrant::models::HashMapValues;
use crate::qdrant::utils::Qdrant;
use crate::utils::conversions::convert_serde_value_to_hashmap_value;
use qdrant_client::client::QdrantClient;
use serde_json::{json, Value};

pub async fn process_messages(
    qdrant_conn: Arc<RwLock<QdrantClient>>,
    mongo_conn: Arc<RwLock<Database>>,
    message: String,
    datasource_id: String,
) -> bool {
    // initiate variables
    let mut message_data: Value = json!({});
    let mut list_of_embedding_data: Vec<HashMap<String, HashMapValues>> = vec![];
    if let Ok(_json) = serde_json::from_str(message.as_str()) {
        message_data = _json;
    }
    let mongodb_connection = mongo_conn.read().await;
    match get_embedding_model(&mongodb_connection, datasource_id.as_str()).await {
        Ok(model_parameter_result) => {
            match model_parameter_result {
                Some(model_parameters) => {
                    let vector_length = model_parameters.embeddingLength as u64;
                    let embedding_model_name = model_parameters.model;
                    let embedding_model_name_clone = embedding_model_name.clone();
                    let ds_clone = datasource_id.clone();
                    let qdrant = Qdrant::new(qdrant_conn, datasource_id);
                    let message_clone = message_data.clone();
                    if let Value::Array(data_array) = message_data {
                        if !data_array.is_empty() {
                            for message in data_array {
                                if let Value::Object(data_obj) = message {
                                    let embedding_data =
                                        convert_serde_value_to_hashmap_value(data_obj);
                                    list_of_embedding_data.push(embedding_data)
                                }
                            }
                        }
                    } else if let Value::Object(data_obj) = message_data {
                        //     Handle the case where the data is being sent as a single object rather than an array of objects
                        list_of_embedding_data.push(convert_serde_value_to_hashmap_value(data_obj));
                    }
                    let text = message_clone
                        .get("document")
                        .unwrap_or(&Value::String("".to_string()))
                        .to_string();
                    if let Ok(point_structs) = embed_table_chunks_async(
                        list_of_embedding_data,
                        text.clone(),
                        Some(ds_clone),
                        EmbeddingModels::from(embedding_model_name),
                    )
                    .await
                    {
                        if let Ok(bulk_upload_result) = qdrant
                            .bulk_upsert_data(
                                point_structs,
                                Some(vector_length),
                                Some(embedding_model_name_clone),
                            )
                            .await
                        {
                            return bulk_upload_result;
                        }
                        return false;
                    }
                }
                None => {
                    eprintln!("Model mongo object returned None!");
                    return false;
                }
            }
        }
        Err(e) => {
            println!("An error occurred: {}", e);
            return false;
        }
    }
    false
}
