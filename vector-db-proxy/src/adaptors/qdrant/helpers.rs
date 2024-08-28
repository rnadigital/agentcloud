use std::collections::HashMap;

use anyhow::Result;
use qdrant_client::client::QdrantClient;
use qdrant_client::qdrant::point_id::PointIdOptions;
use qdrant_client::qdrant::vectors::VectorsOptions;
use qdrant_client::qdrant::{PointStruct, ScrollPoints, ScrollResponse};
use serde_json::json;
use uuid::Uuid;

use crate::embeddings::models::EmbeddingModels;
use crate::vector_databases::models::{ScrollResults, VectorDatabaseStatus};

///
///
/// # Arguments
///
/// * `qdrant_conn`:
/// * &v.to_string()
/// returns: Result<(ScrollResponse, String), Error>
///
/// # Examples
///
/// ```
///
/// ```
pub async fn get_next_page(
    qdrant_conn: &QdrantClient,
    scroll_point: &ScrollPoints,
) -> Result<(ScrollResponse, String)> {
    let result = qdrant_conn.scroll(scroll_point).await?;

    let mut offset = String::from("Done");
    if let Some(point_id) = result.clone().next_page_offset {
        if let Some(point_id_option) = point_id.point_id_options {
            offset = match point_id_option {
                PointIdOptions::Num(num) => num.to_string(),
                PointIdOptions::Uuid(uuid) => uuid,
            }
        }
    }
    Ok((result, offset))
}

pub fn get_scroll_results(result: ScrollResponse) -> Result<Vec<ScrollResults>> {
    let mut response: Vec<ScrollResults> = vec![];
    for result in result.result {
        let mut id = String::new();
        if let Some(point_id) = result.id {
            if let Some(id_option) = point_id.point_id_options {
                id = match id_option {
                    PointIdOptions::Num(num) => num.to_string(),
                    PointIdOptions::Uuid(uuid) => uuid,
                };
            }
        }
        let vectors = result.vectors.unwrap().vectors_options.unwrap();
        let vector = match vectors {
            VectorsOptions::Vector(v) => v.data,
            VectorsOptions::Vectors(_V) => {
                vec![]
            }
        };
        let mut new_payload = result.payload.clone();

        // Deserialize the string to a Value object
        if let Some(variable_value_str) = result.payload.get("variable_value") {
            if let Some(variable_value) = variable_value_str.as_str() {
                if let Ok(value) = serde_json::from_str(variable_value) {
                    new_payload.insert("variable_value".to_string(), value);
                }
            }
        }
        let payload: HashMap<String, String> = new_payload
            .iter()
            .map(|(k, v)| (k.clone(), v.to_string()))
            .collect();
        let res = ScrollResults {
            status: VectorDatabaseStatus::Ok,
            id,
            payload, // Use the modified payload
            vector,
        };
        response.push(res);
    }
    Ok(response)
}

pub async fn construct_point_struct(
    vector: &Vec<f32>,
    payload: HashMap<String, String>,
    vector_name: Option<EmbeddingModels>,
    index: Option<String>,
) -> Option<PointStruct> {
    if !payload.is_empty() {
        return if let Some(model_name) = vector_name {
            if let Some(model) = model_name.to_str() {
                let qdrant_point_struct = PointStruct::new(
                    index.unwrap_or(Uuid::new_v4().to_string()),
                    HashMap::from([(String::from(model), vector.to_owned())]),
                    json!(payload).try_into().unwrap(),
                );
                Some(qdrant_point_struct)
            } else {
                log::error!("Could not convert model to a string slice");
                None
            }
        } else {
            let qdrant_point_struct = PointStruct::new(
                index.unwrap_or(Uuid::new_v4().to_string()),
                vector.to_owned(),
                json!(payload).try_into().unwrap(),
            );
            Some(qdrant_point_struct)
        };
    }
    None
}
