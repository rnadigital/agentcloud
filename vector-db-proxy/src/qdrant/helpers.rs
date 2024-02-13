use actix_web_lab::__reexports::futures_util::stream::FuturesUnordered;
use actix_web_lab::__reexports::futures_util::StreamExt;
use anyhow::{anyhow, Result};

use qdrant_client::client::QdrantClient;
use qdrant_client::prelude::Value;
use qdrant_client::qdrant::point_id::PointIdOptions;
use qdrant_client::qdrant::vectors::VectorsOptions;
use qdrant_client::qdrant::{PointStruct, ScrollPoints, ScrollResponse};

use serde_json::json;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::hash_map_values_as_serde_values;
use crate::llm::models::EmbeddingModels;
use crate::llm::utils::embed_text;
use crate::mongo::client::start_mongo_connection;
use crate::mongo::models::Model;
use crate::mongo::queries::get_embedding_model;
use crate::qdrant::models::{HashMapValues, ScrollResults};
use crate::qdrant::utils::Qdrant;

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

pub async fn embed_table_chunks_async(
    table_chunks: Vec<HashMap<String, HashMapValues>>,
    text: String,
    dataset_id: Option<String>,
    embedding_model: EmbeddingModels,
) -> Result<Vec<PointStruct>> {
    let mut list_of_embeddings: Vec<PointStruct> = vec![];
    let mut futures = FuturesUnordered::new();
    // Within each thread each chunk is processed async by the function `embed_custom_variable_row`
    for chunk in table_chunks.iter() {
        let ds_id = dataset_id.clone();
        let text_clone = text.clone();
        futures.push(async move {
            let embed_result =
                embed_payload(chunk, text_clone, ds_id.clone(), embedding_model).await;
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
    embedding_model: EmbeddingModels,
) -> Result<bool> {
    let ds_id_clone = dataset_id.clone();
    let ds_id_clone_2 = ds_id_clone.clone();
    let text_clone = text.clone();
    let embeddings =
        embed_table_chunks_async(table_chunks, text_clone, Some(dataset_id), embedding_model)
            .await?;
    let qdrant = Qdrant::new(qdrant_conn, ds_id_clone);
    // Once embedding is returned successfully in the form of a PointStruct insert into DB
    let mongodb_connection = start_mongo_connection().await.unwrap();
    let model_parameters: Model = get_embedding_model(&mongodb_connection, ds_id_clone_2.as_str())
        .await
        .unwrap()
        .unwrap();
    match qdrant
        .bulk_upsert_data(
            embeddings,
            Some(model_parameters.embeddingLength as u64),
            None,
        )
        .await?
    {
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
    embedding_model: EmbeddingModels,
) -> Result<PointStruct, anyhow::Error> {
    if !data.is_empty() {
        if let Some(_id) = datasource_id {
            let payload: HashMap<String, serde_json::Value> =
                hash_map_values_as_serde_values!(data);
            if let Ok(metadata) = json!(payload).try_into() {
                // Embedding sentences using OpenAI ADA2
                let embedding_vec = embed_text(vec![&text], &embedding_model).await?;
                // Construct PointStruct to insert into DB
                if !embedding_vec.is_empty() {
                    if let Some(embedding) = embedding_vec.into_iter().next() {
                        let point = PointStruct::new(
                            Uuid::new_v4().to_string(),
                            HashMap::from([(
                                String::from(embedding_model.to_str().unwrap()),
                                embedding.to_owned(),
                            )]), //TODO: not hardcode
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
                    HashMap::from([(String::from(model), vector.to_owned())]), //TODO: not hardcode
                    json!(payload).try_into().unwrap(),
                );
                Some(qdrant_point_struct)
            } else {
                eprintln!("Could not convert model to a string slice");
                None
            }
        } else {
            println!("Embedding Model name is None");
            None
        };
    }
    None
}
