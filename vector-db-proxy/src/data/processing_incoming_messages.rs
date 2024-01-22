use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::mongo::client::start_mongo_connection;
use qdrant_client::client::QdrantClient;
use serde_json::{json, Value};

use crate::mongo::queries::get_team_id_for_datasource;
use crate::qdrant::helpers::embed_table_chunks_async;
use crate::qdrant::models::HashMapValues;
use crate::qdrant::utils::Qdrant;
use crate::utils::conversions::convert_serde_value_to_hashmap_value;

pub async fn process_messages(
    qdrant_conn: Arc<RwLock<QdrantClient>>,
    message: String,
    datasource_id: String,
) -> bool {
    // initiate variables
    let mut message_data: Value = json!({});
    let mut list_of_embedding_data: Vec<HashMap<String, HashMapValues>> = vec![];
    let mut team_id = String::new();

    if let Ok(_json) = serde_json::from_str(message.as_str()) {
        message_data = _json;
    }
    let ds_clone = Some(datasource_id.clone());
    let mongodb_connection = start_mongo_connection().await.unwrap();
    if let Ok(doc) = get_team_id_for_datasource(mongodb_connection, datasource_id).await {
        if let Some(team_id_bson) = doc.get("teamId") {
            team_id = team_id_bson.to_string();
        }
    }
    let qdrant = Qdrant::new(qdrant_conn, team_id);
    if let Value::Array(data_array) = message_data {
        if data_array.len() > 0 {
            for message in data_array {
                if let Value::Object(data_obj) = message {
                    let embedding_data = convert_serde_value_to_hashmap_value(data_obj);
                    list_of_embedding_data.push(embedding_data)
                }
            }
        }
    } else if let Value::Object(data_obj) = message_data {
        //     Handle the case where the data is being sent as a single object rather than an array of objects
        list_of_embedding_data.push(convert_serde_value_to_hashmap_value(data_obj));
    }
    if let Ok(point_structs) = embed_table_chunks_async(list_of_embedding_data, ds_clone).await {
        if let Ok(bulk_upload_result) = qdrant.bulk_upsert_data(point_structs.clone()).await {
            return bulk_upload_result;
        }
        return false;
    }
    return false;
}
