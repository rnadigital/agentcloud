use crate::adaptors::mongo::queries::{get_model_and_embedding_key, increment_by_one};
use crate::embeddings::models::EmbeddingModels;
use crate::embeddings::utils::embed_text;
use crate::utils::conversions::convert_serde_value_to_hashmap_string;
use crate::vector_dbs::models::{Point, SearchRequest, SearchType, VectorDatabaseStatus};
use crate::vector_dbs::vector_database::VectorDatabase;
use anyhow::anyhow;
use crossbeam::channel::Receiver;
use mongodb::Database;
use serde_json::Value;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

pub async fn embed_text_construct_point(
    mongo_conn: Arc<RwLock<Database>>,
    data: &HashMap<String, String>,
    embedding_field_name: &String,
    datasource_id: Option<String>,
    embedding_model: EmbeddingModels,
) -> anyhow::Result<Point, anyhow::Error> {
    if !data.is_empty() {
        if let Some(_id) = datasource_id {
            // Convert embedding_field_name to lowercase
            let mut payload = data.clone();
            if let Some(value) = payload.remove(embedding_field_name) {
                //Renaming the embedding field to page_content
                payload.insert("page_content".to_string(), value.clone());
                // Embedding data
                let embedding_vec =
                    embed_text(mongo_conn, _id, vec![&value.to_string()], &embedding_model).await?;
                // Construct a Point to insert into the vector DB
                if !embedding_vec.is_empty() {
                    if let Some(vector) = embedding_vec.into_iter().next() {
                        let point =
                            Point::new(Some(Uuid::new_v4().to_string()), vector, Some(payload));
                        return Ok(point);
                    }
                }
            }
        } else {
            return Err(anyhow!(
                "Could not find an stream ID for this payload. Aborting embedding!"
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
        &metadata,
        &embedding_field_name,
        Some(datasource_id_clone),
        EmbeddingModels::from(embedding_model_name),
    )
    .await
    {
        Ok(point) => match vector_database_client_connection
            .insert_point(search_request, point)
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
    receiver: Receiver<(String, String)>,
    vector_database_client: Arc<RwLock<dyn VectorDatabase>>,
    mongo_conn: Arc<RwLock<Database>>,
) {
    let mongo_connection = Arc::clone(&mongo_conn);
    let receiver_clone = receiver.clone();
    while let Ok(msg) = receiver_clone.recv() {
        let (datasource_id, message) = msg;
        match serde_json::from_str(message.as_str()) {
            Ok::<Value, _>(message_data) => {
                let mongo = mongo_connection.read().await;
                match get_model_and_embedding_key(&mongo, datasource_id.as_str()).await {
                    Ok((model_parameter_result, embedding_field)) => match model_parameter_result {
                        Some(model_parameters) => {
                            let embedding_model_name = model_parameters.model;
                            let datasources_clone = datasource_id.clone();
                            if let Value::Object(mut data_obj) = message_data {
                                // This is to account for airbyte sending the data in the _airbyte_data object when the destination is PubSub
                                if let Some(is_pubsub) = data_obj.get("_airbyte_data") {
                                    if let Some(pubsub_is_obj) = is_pubsub.as_object() {
                                        data_obj = pubsub_is_obj.to_owned();
                                    }
                                }
                                let metadata =
                                    convert_serde_value_to_hashmap_string(data_obj.to_owned());
                                if let Some(embedding_field_name) = embedding_field {
                                    let mongo_connection_clone = Arc::clone(&mongo_connection);
                                    let vector_database = Arc::clone(&vector_database_client);
                                    let embed_text_worker = tokio::spawn(async move {
                                        let _ = handle_embedding(
                                            mongo_connection_clone,
                                            vector_database,
                                            metadata,
                                            embedding_field_name,
                                            datasources_clone,
                                            embedding_model_name,
                                        )
                                        .await;
                                    });
                                    tokio::select! {
                                        _ = embed_text_worker => log::info!("Finished embedding task")
                                    }
                                }
                            }
                        }
                        None => {
                            log::error!("Model mongo object returned None!");
                        }
                    },
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
