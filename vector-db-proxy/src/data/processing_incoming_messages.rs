use crate::adaptors::mongo::models::UnstructuredChunkingConfig;
use crate::adaptors::mongo::queries::{get_model_and_embedding_key, increment_by_one};
use crate::data::helpers::hash_string_to_uuid;
use crate::data::unstructuredio::apis::chunk_text;
use crate::embeddings::models::EmbeddingModels;
use crate::embeddings::utils::{embed_bulk_insert_unstructured_response, embed_text};
use crate::init::env_variables::GLOBAL_DATA;
use crate::utils::conversions::convert_serde_value_to_hashmap_string;
use crate::vector_databases::models::{Point, SearchRequest, SearchType, VectorDatabaseStatus};
use crate::vector_databases::vector_database::VectorDatabase;
use anyhow::anyhow;
use crossbeam::channel::Receiver;
use mongodb::Database;
use serde_json::Value;
use std::collections::HashMap;
use std::io::Cursor;
use std::sync::Arc;
use tokio::sync::RwLock;

pub async fn embed_text_construct_point(
    mongo_conn: Arc<RwLock<Database>>,
    vector_database_client: Arc<RwLock<dyn VectorDatabase>>,
    data: &HashMap<String, String>,
    embedding_field_name: &String,
    datasource_id: Option<String>,
    embedding_model: EmbeddingModels,
    chunking_strategy: Option<UnstructuredChunkingConfig>,
) -> anyhow::Result<Option<Point>, anyhow::Error> {
    if !data.is_empty() {
        if let Some(_id) = datasource_id.clone() {
            // Convert embedding_field_name to lowercase
            let mut payload = data.clone();
            if let Some(value) = payload.remove(embedding_field_name) {
                if let Some(chunking_config) = chunking_strategy.clone() {
                    let global_data = GLOBAL_DATA.read().await.clone();
                    let unstructuredio_url = global_data.unstructuredio_url;
                    let unstructuredio_api_key =
                        Some(global_data.unstructuredio_api_key).filter(|s| !s.is_empty());
                    //    write value to buffer
                    let buffer = Cursor::new(value.as_bytes().to_vec());
                    let handle = tokio::task::spawn_blocking(move || {
                        let response = chunk_text(
                            unstructuredio_url,
                            unstructuredio_api_key,
                            buffer,
                            None,
                            chunking_strategy,
                            chunking_config.file_type,
                        );
                        response
                    });
                    match handle.await? {
                        Ok(documents) => {
                            embed_bulk_insert_unstructured_response(
                                documents,
                                datasource_id.unwrap(),
                                vector_database_client.clone(),
                                mongo_conn.clone(),
                                embedding_model,
                                Some(payload),
                            )
                            .await;
                            return Ok(None);
                        }
                        Err(e) => {
                            log::error!("{}", e);
                        }
                    }
                } else {
                    payload.insert("page_content".to_string(), value.clone());
                }
                //Renaming the embedding field to page_content
                // Embedding data
                let embedding_vec =
                    embed_text(mongo_conn, _id, vec![&value.to_string()], &embedding_model).await?;
                // Construct a Point to insert into the vector DB
                if !embedding_vec.is_empty() {
                    if let Some(vector) = embedding_vec.into_iter().next() {
                        let index = payload.get("index").map_or(None, |id| Some(id.to_owned()));
                        let point = Point::new(index, vector, Some(payload));
                        return Ok(Some(point));
                    }
                }
            }
        } else {
            return Err(anyhow!(
                "Could not find a stream ID for this payload. Aborting embedding!"
            ));
        }
    }
    Err(anyhow!("Row is empty"))
}

async fn handle_embedding(
    mongo_connection: Arc<RwLock<Database>>,
    vector_database_client: Arc<RwLock<dyn VectorDatabase>>,
    metadata: HashMap<String, String>,
    embedding_field_name: String,
    datasource_id: String,
    embedding_model_name: String,
    chunking_strategy: Option<UnstructuredChunkingConfig>,
) {
    let mongo_connection_clone = Arc::clone(&mongo_connection);
    let vector_database_clone = Arc::clone(&vector_database_client);
    let metadata = metadata.clone();
    let datasource_id_clone = datasource_id.clone();
    let datasource_id_clone_2 = datasource_id.clone();
    let mut field_path = "recordCount.failure";
    let mongo = mongo_connection_clone.read().await;
    let vector_database_client_connection = vector_database_clone.read().await;
    let search_request = SearchRequest::new(SearchType::Collection, datasource_id_clone_2.clone());
    match embed_text_construct_point(
        mongo_connection.clone(),
        vector_database_client.clone(),
        &metadata,
        &embedding_field_name,
        Some(datasource_id_clone),
        EmbeddingModels::from(embedding_model_name),
        chunking_strategy,
    )
    .await
    {
        Ok(point) => match point {
            Some(p) => {
                match vector_database_client_connection
                    .insert_point(search_request, p)
                    .await
                {
                    Ok(result) => match result {
                        VectorDatabaseStatus::Ok => {
                            field_path = "recordCount.success";
                            increment_by_one(&mongo, &datasource_id_clone_2, field_path)
                                .await
                                .unwrap();
                        }
                        _ => {
                            log::warn!("An error occurred while inserting into vector database");
                            increment_by_one(&mongo, &datasource_id_clone_2, field_path)
                                .await
                                .unwrap();
                        }
                    },
                    Err(e) => {
                        log::warn!(
                            "An error occurred while inserting into vector database. Error: {}",
                            e
                        );
                        increment_by_one(&mongo, &datasource_id_clone_2, field_path)
                            .await
                            .unwrap();
                    }
                }
            }
            None => (),
        },
        Err(e) => {
            increment_by_one(&mongo, &datasource_id_clone_2, field_path)
                .await
                .unwrap();
            log::error!(
                "An error occurred while upserting  point structs to Qdrant: {}",
                e
            );
        }
    }
}

pub async fn process_incoming_messages(
    receiver: Receiver<(String, Option<String>, String)>,
    vector_database_client: Arc<RwLock<dyn VectorDatabase>>,
    mongo_conn: Arc<RwLock<Database>>,
) {
    let mongo_connection = Arc::clone(&mongo_conn);
    let receiver_clone = receiver.clone();
    let global_data = GLOBAL_DATA.read().await;
    while let Ok(msg) = receiver_clone.recv() {
        let (datasource_id, stream_config_key, message) = msg;
        match serde_json::from_str(message.as_str()) {
            Ok::<Value, _>(message_data) => {
                let mongo = mongo_connection.read().await;
                match get_model_and_embedding_key(&mongo, datasource_id.as_str(), stream_config_key)
                    .await
                {
                    Ok(embedding_config) => {
                        if let Some(embedding_model) = embedding_config.model {
                            let datasources_clone = datasource_id.clone();
                            // extract metadata from message if message is coming from pubsub
                            if let Value::Object(mut data_obj) = message_data {
                                // This is to account for airbyte sending the data in the _airbyte_data object when the destination is PubSub
                                if let Some(is_pubsub) = data_obj.get("_airbyte_data") {
                                    if let Some(pubsub_is_obj) = is_pubsub.as_object() {
                                        data_obj = pubsub_is_obj.to_owned();
                                    }
                                }
                                // Convert metadata to hashmap string
                                let mut metadata =
                                    convert_serde_value_to_hashmap_string(data_obj.to_owned());

                                // If we find a primary key associated with the datasource, use
                                // as vector index so that we do not create duplicates
                                if let Some(list_of_primary_keys) = embedding_config.primary_key {
                                    let list_of_primary_key_values: Vec<String> =
                                        list_of_primary_keys
                                            .iter()
                                            .map(|k| metadata.get(k).cloned().unwrap())
                                            .collect();
                                    if let Ok(json_string) =
                                        serde_json::to_string(&list_of_primary_key_values)
                                    {
                                        let json_string_hash = hash_string_to_uuid(
                                            global_data.hashing_salt.as_str(),
                                            json_string.as_str(),
                                        );
                                        metadata.insert(
                                            String::from("index"),
                                            json_string_hash.to_string(),
                                        );
                                    }
                                };

                                if let Some(embedding_field_name) = embedding_config.embedding_key {
                                    let mongo_connection_clone = Arc::clone(&mongo_connection);
                                    let vector_database = Arc::clone(&vector_database_client);
                                    let embed_text_worker = tokio::spawn(async move {
                                        let _ = handle_embedding(
                                            mongo_connection_clone,
                                            vector_database,
                                            metadata,
                                            embedding_field_name,
                                            datasources_clone,
                                            embedding_model.model,
                                            embedding_config.chunking_strategy,
                                        )
                                        .await;
                                    });
                                    tokio::select! {
                                        _ = embed_text_worker => log::info!("Finished embedding task")
                                    }
                                }
                            }
                        }
                    }
                    Err(e) => {
                        log::error!("An error occurred: {}", e);
                    }
                }
            }
            Err(e) => {
                log::error!(
                    "An error occurred while attempting to convert message to JSON: {}",
                    e
                );
            }
        }
    }
}
