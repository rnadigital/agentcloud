use anyhow::Result;
use qdrant_client::client::QdrantClient;
use qdrant_client::qdrant::point_id::PointIdOptions;
use qdrant_client::qdrant::vectors::VectorsOptions;
use qdrant_client::qdrant::{PointId, PointStruct, ScrollPoints, ScrollResponse};
use serde_json::{json, to_string, Value};
use std::collections::HashMap;
use uuid::Uuid;

use crate::embeddings::models::EmbeddingModels;
use crate::vector_databases::models::{ScrollResults, VectorDatabaseStatus};

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
    payload: HashMap<String, Value>,
    vector_name: Option<EmbeddingModels>,
    index: Option<Value>,
) -> Option<PointStruct> {
    if !payload.is_empty() {
        let vector_id = index.map_or_else(
            || PointId::from(Uuid::new_v4().to_string()),
            |id| {
                let id_str = to_string(&id).unwrap().replace(['\"', '\\'], "");
                if Uuid::parse_str(&id_str).is_ok() {
                    PointId::from(id_str)
                } else {
                    PointId::from(Uuid::new_v4().to_string())
                }
            },
        );
        match vector_name {
            Some(embedding_model) => {
                if let Some(model) = embedding_model.to_str() {
                    let qdrant_point_struct = PointStruct::new(
                        vector_id,
                        HashMap::from([(String::from(model), vector.to_owned())]),
                        json!(payload).try_into().unwrap(),
                    );
                    return Some(qdrant_point_struct);
                };
            }
            None => {
                let qdrant_point_struct = PointStruct::new(
                    vector_id,
                    vector.to_owned(),
                    json!(payload).try_into().unwrap(),
                );
                return Some(qdrant_point_struct);
            }
        };
    }
    None
}
