use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

use qdrant_client::client::QdrantClient;
use serde_json::{json, Value};

use crate::qdrant::helpers::embed_table_chunks_async;
use crate::qdrant::models::HashMapValues;
use crate::qdrant::utils::Qdrant;
use crate::utils::conversions::convert_serde_value_to_hashmap_value;

pub async fn embed_insert(qdrant: &Qdrant, points: Vec<HashMap<String, HashMapValues>>) -> bool {
    if let Ok(point_structs) = embed_table_chunks_async(points).await {
        println!("Table chunk processed");
        if let Ok(bulk_upload_result) = qdrant.bulk_upsert_data(point_structs.clone()).await {
            return bulk_upload_result;
        }
        return false;
    }
    return false;
}

pub async fn process_messages(
    qdrant_conn: Arc<Mutex<QdrantClient>>,
    message: String,
    stream_id: String,
) {
    let mut message_data: Value = json!({});
    if let Ok(_json) = serde_json::from_str(message.as_str()) {
        message_data = _json;
    }
    println!("Message Data {:?}", message_data);
    // Ensure that the data is being sent in the correct format. Array of ob
    if let Value::Array(data_array) = message_data {
        if data_array.len() > 0 {
            let qdrant = Qdrant::new(qdrant_conn, stream_id);
            let mut list_of_embedding_data: Vec<HashMap<String, HashMapValues>> = vec![];
            for message in data_array {
                if let Value::Object(data_obj) = message {
                    let embedding_data = convert_serde_value_to_hashmap_value(data_obj);
                    list_of_embedding_data.push(embedding_data)
                }
            }
            match embed_insert(&qdrant, list_of_embedding_data).await {
                true => {
                    log::info!("embedding and inserting points into vector db successful");
                }
                false => {
                    log::info!("embedding and inserting points into vector db successful");
                }
            };
        } else {
            log::warn!("List has length zero")
        }
    } else if let Value::Object(data_obj) = message_data {
        //     Handle the case where the data is being sent as an object rather than an array of objects
        println!("Data Object {:?}", data_obj);
        let qdrant = Qdrant::new(qdrant_conn, stream_id);
        let embedding_data = convert_serde_value_to_hashmap_value(data_obj);
        match embed_insert(&qdrant, vec![embedding_data]).await {
            true => {
                log::info!("embedding and inserting points into vector db successful");
            }
            false => {
                log::info!("embedding and inserting points into vector db successful");
            }
        };
    } else {
        log::warn!("No stream ID found in payload...can not upload!")
    }
}
