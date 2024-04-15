use anyhow::{anyhow, Result};

use qdrant_client::client::QdrantClient;
use qdrant_client::prelude::Value;
use qdrant_client::qdrant::point_id::PointIdOptions;
use qdrant_client::qdrant::vectors::VectorsOptions;
use qdrant_client::qdrant::{PointStruct, ScrollPoints, ScrollResponse};
use serde_json::json;
use std::collections::HashMap;
use std::sync::Arc;
use mongodb::Database;
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::hash_map_values_as_serde_values;
use crate::llm::models::EmbeddingModels;
use crate::llm::utils::embed_text;
use crate::qdrant::models::ScrollResults;

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
    qdrant_conn: Arc<RwLock<QdrantClient>>,
    scroll_point: &ScrollPoints,
) -> Result<(ScrollResponse, String)> {
    let result = qdrant_conn.read().await.scroll(scroll_point).await?;

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
        let res = ScrollResults {
            id,
            payload: new_payload, // Use the modified payload
            vector,
        };
        response.push(res);
    }
    Ok(response)
}

///
///
/// # Arguments
///
/// * `row`:
///
/// returns: Result<PointStruct, Error>
///
/// # Examples
///
/// ```
///
/// ```
pub async fn embed_payload(
    mongo_conn: Arc<RwLock<Database>>,
    data: &HashMap<String, String>,
    text: &String,
    datasource_id: Option<String>,
    embedding_model: EmbeddingModels,
) -> Result<PointStruct, anyhow::Error> {
    if !data.is_empty() {
        if let Some(_id) = datasource_id {
            let payload: HashMap<String, serde_json::Value> =
                hash_map_values_as_serde_values!(data);
            if let Ok(metadata) = json!(payload).try_into() {
                // Embedding sentences using OpenAI ADA2
                let embedding_vec = embed_text(mongo_conn, _id, vec![text], &embedding_model).await?;
                // Construct PointStruct to insert into DB
                // todo: need to break this out so that this happens in a different method so we can re-use this for files
                if !embedding_vec.is_empty() {
                    if let Some(embedding) = embedding_vec.into_iter().next() {
                        let point = PointStruct::new(
                            Uuid::new_v4().to_string(),
                            HashMap::from([(
                                String::from(embedding_model.to_str().unwrap()),
                                embedding.to_owned(),
                            )]),
                            metadata,
                        );
                        return Ok(point);
                    }
                }
            } else {
                return Err(anyhow!(
                    "Could not convert payload to JSON type. Aborting embedding!"
                ));
            }
        } else {
            return Err(anyhow!(
                "Could not find an stream ID for this payload. Aborting embedding!"
            ));
        }
    }
    Err(anyhow!("Row is empty"))
}

pub async fn reverse_embed_payload(payload: &HashMap<String, Value>) -> Result<Vec<String>> {
    if !payload.is_empty() {
        if let Some(text) = payload.get("text") {
            Ok(vec![text.to_string()])
        } else {
            Err(anyhow!("Payload did not contain the text field. Aborting!"))
        }
    } else {
        Err(anyhow!("Payload is empty"))
    }
}

pub async fn construct_point_struct(
    vector: &Vec<f32>,
    payload: HashMap<String, String>,
    embedding_models: Option<EmbeddingModels>,
) -> Option<PointStruct> {
    if !payload.is_empty() {
        return if let Some(model_name) = embedding_models {
            if let Some(model) = model_name.to_str() {
                let qdrant_point_struct = PointStruct::new(
                    Uuid::new_v4().to_string(),
                    HashMap::from([(String::from(model), vector.to_owned())]),
                    json!(payload).try_into().unwrap(),
                );
                Some(qdrant_point_struct)
            } else {
                log::error!("Could not convert model to a string slice");
                None
            }
        } else {
            log::warn!("Embedding Model name is None");
            None
        };
    }
    None
}
