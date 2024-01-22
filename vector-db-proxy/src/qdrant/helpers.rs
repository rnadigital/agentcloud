use actix_web_lab::__reexports::futures_util::stream::FuturesUnordered;
use actix_web_lab::__reexports::futures_util::StreamExt;
use anyhow::{anyhow, Result};

use crate::hash_map_values_as_serde_values;
use crate::llm::utils::LLM;
use crate::qdrant::models::{HashMapValues, ScrollResults};
use crate::qdrant::utils::Qdrant;

use qdrant_client::client::QdrantClient;
use qdrant_client::prelude::{PointStruct, Value};
use qdrant_client::qdrant::point_id::PointIdOptions;
use qdrant_client::qdrant::vectors::VectorsOptions;
use qdrant_client::qdrant::{ScrollPoints, ScrollResponse};

use serde_json::json;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

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
    let result = qdrant_conn.read().await.scroll(&scroll_point).await?;

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

pub async fn embed_table_chunks_async(
    table_chunks: Vec<HashMap<String, HashMapValues>>,
    text: String,
    dataset_id: Option<String>,
) -> Result<Vec<PointStruct>> {
    let mut list_of_embeddings: Vec<PointStruct> = vec![];
    let mut futures = FuturesUnordered::new();
    // Within each thread each chunk is processed async by the function `embed_custom_variable_row`
    for chunk in table_chunks.iter() {
        let ds_id = dataset_id.clone();
        let text_clone = text.clone();
        futures.push(async move {
            let embed_result = embed_payload(chunk, text_clone, ds_id.clone()).await;
            return match embed_result {
                Ok(point) => Ok::<PointStruct, anyhow::Error>(point),
                Err(e) => Err(anyhow!("Embedding row failed: {}", e)),
            };
        });
    }
    while let Some(result) = futures.next().await {
        match result {
            Ok(point) => list_of_embeddings.push(point),
            Err(err) => eprintln!("Err: {}", err),
        }
    }
    Ok(list_of_embeddings)
}

///
///
/// # Arguments
///
/// * `qdrant_conn`:
/// * `table_chunks`:
/// * `dataset_id`:
///
/// returns: Result<bool, Error>
///
/// # Examples
///
/// ```
///
/// ```
// Each thread calls this function and passes it a table chunk
pub async fn process_table_chunks_async(
    qdrant_conn: Arc<RwLock<QdrantClient>>,
    table_chunks: Vec<HashMap<String, HashMapValues>>,
    text: String,
    dataset_id: String,
) -> Result<bool> {
    let ds_id_clone = dataset_id.clone();
    let text_clone = text.clone();
    let embeddings = embed_table_chunks_async(table_chunks, text_clone, Some(dataset_id)).await?;
    let qdrant = Qdrant::new(qdrant_conn, ds_id_clone);
    // Once embedding is returned successfully in the form of a PointStruct insert into DB
    match qdrant.bulk_upsert_data(embeddings).await? {
        true => {
            println!("Upsert Successful!");
            Ok(true)
        }
        false => {
            println!("Upsert Failed!");
            Ok(true)
        }
    }
}

///
///
/// # Arguments
///
/// * `row`:
///
/// returns: Result<Vec<String, Global>, Error>
///
/// # Examples
///
/// ```
///
/// ```
pub fn payload_to_sentence(row: &HashMap<String, serde_json::Value>) -> Result<Vec<String>> {
    let default_values = serde_json::Value::String("".to_string());
    let event_id = row.get("event_id").unwrap_or(&default_values);
    let user_id = row.get("user_id").unwrap_or(&default_values);
    let container_id = row.get("container_id").unwrap_or(&default_values);
    let event = row.get("event").unwrap_or(&default_values);
    let vendor = row.get("vendor").unwrap_or(&default_values);
    let pii_type = row.get("pii_type").unwrap_or(&default_values);
    let variable_name = row.get("variable_name").unwrap_or(&default_values);
    let variable_value = row.get("variable_value").unwrap_or(&default_values);
    let values: Value = serde_json::from_value(variable_value.to_owned())?;
    // Formulating Sentence
    let sentence = [format!(
        "event_id: {:?}, user_id: {:?}, container_id: {:?}, event_name: {:?}, vendor: {:?},
         pii_type: {:?}, key: {:?}, value: {:?}",
        event_id.to_string().as_str(),
        user_id.to_string().as_str(),
        container_id.to_string().as_str(),
        event.to_string().as_str(),
        vendor.to_string().as_str(),
        pii_type.to_string().as_str(),
        variable_name.to_string().as_str(),
        values
    )
    .replace("\n", "")
    .replace("\"", "")
    .trim()
    .to_lowercase()];

    Ok(sentence.to_vec())
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
    data: &HashMap<String, HashMapValues>,
    text: String,
    datasource_id: Option<String>,
) -> Result<PointStruct, anyhow::Error> {
    if !data.is_empty() {
        if let Some(_id) = datasource_id {
            let payload: HashMap<String, serde_json::Value> =
                hash_map_values_as_serde_values!(data);
            if let Ok(metadata) = json!(payload).try_into() {
                let llm_struct = LLM::new();
                // Embedding sentences using OpenAI ADA2
                let embedding_vec = llm_struct.embed_text(vec![text]).await?;
                // Construct PointStruct to insert into DB
                if !embedding_vec.is_empty() {
                    for embedding in embedding_vec {
                        let point = PointStruct::new(
                            Uuid::new_v4().to_string(),
                            embedding.to_owned(),
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
    return Err(anyhow!("Row is empty"));
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
