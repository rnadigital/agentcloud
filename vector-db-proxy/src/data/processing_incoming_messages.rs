use crate::adaptors::mongo::models::{DataSources, Model, UnstructuredChunkingConfig};
use crate::adaptors::mongo::queries::{
    get_model_and_embedding_key, increment_by_one, set_datasource_state,
};
use crate::data::helpers::hash_string_to_uuid;
use crate::data::unstructuredio::apis::chunk_text;
use crate::embeddings::helpers::clean_text;
use crate::embeddings::utils::{embed_bulk_insert_unstructured_response, embed_text};
use crate::init::env_variables::GLOBAL_DATA;
use crate::vector_databases::helpers::check_byo_vector_database;
use crate::vector_databases::models::{Point, SearchRequest, SearchType, VectorDatabaseStatus, Region};
use crate::vector_databases::vector_database::default_vector_db_client;
use anyhow::anyhow;
use crossbeam::channel::Receiver;
use mongodb::Database;
use serde_json::{to_vec, Value};
use std::collections::HashMap;
use std::io::Cursor;
use std::sync::Arc;
use tokio::sync::RwLock;

pub async fn embed_text_construct_point(
    mongo_conn: Arc<RwLock<Database>>,
    data: &HashMap<String, Value>,
    embedding_field_name: &String,
    datasource: Option<DataSources>,
    embedding_model: Model,
    chunking_strategy: Option<UnstructuredChunkingConfig>,
    search_type: SearchType,
) -> anyhow::Result<Option<Point>, anyhow::Error> {
    if !data.is_empty() {
        if let Some(ds) = datasource {
            // Convert embedding_field_name to lowercase
            let mut payload: HashMap<String, Value> = data.clone();
            if let Some(value) = payload.remove(embedding_field_name) {
                payload.insert(
                    "page_content".to_string(),
                    Value::String(clean_text(value.to_string())),
                );

                if let Some(chunking_config) = chunking_strategy.clone() {
                    let global_data = GLOBAL_DATA.read().await.clone();
                    let unstructuredio_url = global_data.unstructuredio_url;
                    let unstructuredio_api_key =
                        Some(global_data.unstructuredio_api_key).filter(|s| !s.is_empty());
                    //    write value to buffer
                    let buffer =
                        Cursor::new(to_vec(&Value::String(clean_text(value.to_string())))?);
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
                                ds,
                                mongo_conn.clone(),
                                embedding_model,
                                Some(payload),
                                search_type,
                            )
                            .await;
                            return Ok(None);
                        }
                        Err(e) => {
                            log::error!(
                                "Error embedding response from unstructuredIO. Error: {}",
                                e
                            );
                        }
                    }
                }
                // Embedding data
                let embedding_vec =
                    embed_text(vec![&clean_text(value.to_string())], &embedding_model).await?;
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
    //mut vector_database_client: Arc<RwLock<dyn VectorDatabase>>,
    metadata: HashMap<String, Value>,
    embedding_field_name: String,
    datasource: DataSources,
    embedding_model: Model,
    chunking_strategy: Option<UnstructuredChunkingConfig>,
) {
    let mongo_connection_clone = Arc::clone(&mongo_connection);
    let metadata = metadata.clone();
    let field_path = "recordCount.failure";
    let mongo = mongo_connection_clone.read().await;
    let vector_database_client = check_byo_vector_database(datasource.clone(), &mongo)
        .await
        .unwrap_or(default_vector_db_client().await);
    let search_type = chunking_strategy
        .clone()
        .map_or(SearchType::default(), |_| SearchType::Collection);
    let mut search_request =
        SearchRequest::new(search_type.clone(), datasource.id.to_string().clone());
    //TODO: add vars to search request
    search_request.byo_vector_db = datasource.byo_vector_db;
    search_request.collection = datasource
        .clone()
        .collection_name
        .map_or(datasource.id.to_string(), |d| d);
    search_request.namespace = datasource.namespace.clone();
    search_request.region = datasource.region.clone().map(|r| Region::from_str(&r));
    println!("Search request going to vector API: {:?}", search_request);
    match embed_text_construct_point(
        mongo_connection.clone(),
        &metadata,
        &embedding_field_name,
        Some(datasource.clone()),
        embedding_model,
        chunking_strategy,
        search_type,
    )
    .await
    {
        Ok(point) => match point {
            Some(p) => {
                vector_database_client.read().await.display_config().await;
                match vector_database_client
                    .read()
                    .await
                    .insert_point(search_request, p)
                    .await
                {
                    Ok(result) => match result {
                        VectorDatabaseStatus::Ok => (),
                        _ => {
                            log::warn!("An error occurred while inserting into vector database");
                            increment_by_one(&mongo, &datasource.id.to_string(), field_path)
                                .await
                                .unwrap();
                        }
                    },
                    Err(e) => {
                        log::warn!(
                            "An error occurred while inserting into vector database. Error: {}",
                            e
                        );
                        increment_by_one(&mongo, &datasource.id.to_string(), field_path)
                            .await
                            .unwrap();
                    }
                }
            }
            None => (),
        },
        Err(e) => {
            increment_by_one(&mongo, &datasource.id.to_string(), field_path)
                .await
                .unwrap();
            log::error!(
                "An error occurred while upserting  point structs to vector database: {}",
                e
            );
        }
    }
    drop(vector_database_client)
}

pub async fn process_incoming_messages(
    receiver: Receiver<(DataSources, Option<String>, String)>,
    //vector_database_client: Arc<RwLock<dyn VectorDatabase>>,
    mongo_conn: Arc<RwLock<Database>>,
) {
    let mongo_connection = Arc::clone(&mongo_conn);
    let receiver_clone = receiver.clone();
    let global_data = GLOBAL_DATA.read().await;
    while let Ok(msg) = receiver_clone.recv() {
        let (datasource, stream_config_key, message) = msg;
        let datasource_clone = datasource.clone();
        match serde_json::from_str(message.as_str()) {
            Ok::<Value, _>(message_data) => {
                let mongo = mongo_connection.read().await;
                match get_model_and_embedding_key(&mongo, datasource.clone(), stream_config_key)
                    .await
                {
                    Ok(embedding_config) => {
                        if let Some(embedding_model) = embedding_config.model {
                            // extract metadata from message if message is coming from pubsub
                            if let Value::Object(mut data_obj) = message_data {
                                // This is to account for airbyte sending the data in the _airbyte_data object when the destination is PubSub
                                if let Some(is_pubsub) = data_obj.get("_airbyte_data") {
                                    if let Some(pubsub_is_obj) = is_pubsub.as_object() {
                                        data_obj = pubsub_is_obj.to_owned();
                                    }
                                }

                                let mut metadata = HashMap::from_iter(data_obj);
                                // If we find a primary key associated with the datasource, use
                                // as vector index so that we do not create duplicates
                                if let Some(list_of_primary_keys) = embedding_config.primary_key {
                                    let list_of_primary_key_values: Vec<Value> =
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
                                            Value::String(json_string_hash),
                                        );
                                    }
                                };

                                if let Some(embedding_field_name) = embedding_config.embedding_key {
                                    let mongo_connection_clone = Arc::clone(&mongo_connection);
                                    let embed_text_worker = tokio::spawn(async move {
                                        let _ = handle_embedding(
                                            mongo_connection_clone,
                                            metadata,
                                            embedding_field_name,
                                            datasource.clone(),
                                            embedding_model,
                                            embedding_config.chunking_strategy,
                                        )
                                        .await;
                                    });
                                    tokio::select! {
                                        _ = embed_text_worker => {
                                            set_datasource_state(
                                                &mongo,
                                                datasource_clone,
                                                "ready"
                                            ).await.unwrap();
                                            log::info!("Finished embedding task")
                                        }
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
