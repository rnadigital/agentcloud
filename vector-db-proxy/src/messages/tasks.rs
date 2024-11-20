use crate::adaptors::gcp::models::PubSubConnect;
use crate::adaptors::mongo::models::{DataSources, UnstructuredChunkingConfig};
use crate::adaptors::mongo::queries::{get_datasource, get_model};
use crate::adaptors::rabbitmq::models::RabbitConnect;
use crate::data::unstructuredio::apis::chunk_text;
use crate::embeddings::utils::embed_bulk_insert_unstructured_response;
use crate::init::env_variables::GLOBAL_DATA;
use crate::messages::models::{MessageQueueConnection, MessageQueueProvider, QueueConnectionTypes};
use crate::messages::task_handoff::send_task;
use crate::utils::file_operations;
use crate::utils::file_operations::determine_file_type;
use crate::utils::webhook::send_webapp_embed_ready;
use crate::vector_databases::models::SearchType;
use crossbeam::channel::Sender;
use mongodb::Database;
use serde_json::Value;
use std::io::Cursor;
use std::sync::Arc;
use tokio::sync::RwLock;

pub async fn get_message_queue(
    message_queue_provider: MessageQueueProvider,
) -> QueueConnectionTypes {
    let global_data = GLOBAL_DATA.read().await;
    match message_queue_provider {
        MessageQueueProvider::RABBITMQ => {
            println!("Using RabbitMQ as the streaming Queue!");
            let rabbitmq_connection = RabbitConnect {
                host: global_data.rabbitmq_host.clone(),
                port: global_data.rabbitmq_port,
                username: global_data.rabbitmq_username.clone(),
                password: global_data.rabbitmq_password.clone(),
            };
            rabbitmq_connection.connect().await.unwrap()
        }
        MessageQueueProvider::PUBSUB => {
            println!("Using PubSub as the streaming Queue!");
            let pubsub_connection = PubSubConnect {
                topic: global_data.rabbitmq_stream.clone(),
                subscription: global_data.rabbitmq_stream.clone(),
            };
            pubsub_connection.connect().await.unwrap()
        }
        MessageQueueProvider::UNKNOWN => {
            panic!("Unknown message Queue provider specified. Aborting application!");
        }
    }
}

pub async fn process_message(
    message_string: String,
    stream_type: Option<String>,
    datasource_id: &str,
    stream_config_key: Option<String>,
    //vector_database_client: Arc<RwLock<dyn VectorDatabase>>,
    mongo_client: Arc<RwLock<Database>>,
    sender: Sender<(DataSources, Option<String>, String)>,
) {
    let mongodb_connection = mongo_client.read().await;
    let global_data = GLOBAL_DATA.read().await.clone();
    println!("Datasource ID: {}", datasource_id);
    match get_datasource(&mongodb_connection, datasource_id).await {
        Ok(datasource) => {
            if let Some(ds) = datasource {
                if let Ok(Some(model_parameters)) =
                    get_model(&mongodb_connection, datasource_id).await
                {
                    if let Some(stream_type) = stream_type {
                        if let Ok(_json) = serde_json::from_str(message_string.as_str()) {
                            let message_data: Value = _json; // this is necessary because  you can not do type annotation inside a if let Ok() expression
                            match file_operations::read_file_from_source(
                                Some(stream_type.to_string()),
                                message_data,
                            )
                            .await
                            {
                                Some((_, file, file_path)) => {
                                    let buffer = Cursor::new(file);
                                    let file_type = determine_file_type(file_path.as_str());
                                    let unstructuredio_url = global_data.unstructuredio_url;
                                    let unstructuredio_api_key =
                                        Some(global_data.unstructuredio_api_key)
                                            .filter(|s| !s.is_empty());
                                    let chunking_strategy: Option<UnstructuredChunkingConfig> =
                                        ds.clone().chunking_config;
                                    let handle = tokio::task::spawn_blocking(move || {
                                        let response = chunk_text(
                                            unstructuredio_url,
                                            unstructuredio_api_key,
                                            buffer,
                                            Some(file_path),
                                            chunking_strategy,
                                            Some(file_type),
                                        );
                                        response
                                    });
                                    // dynamically get user's chunking strategy of choice from the database
                                    let model_obj_clone = model_parameters.clone();
                                    match handle.await.unwrap() {
                                        Ok(documents) => {
                                            embed_bulk_insert_unstructured_response(
                                                documents,
                                                ds,
                                                //vector_database_client.clone(),
                                                mongo_client.clone(),
                                                model_obj_clone,
                                                None,
                                                SearchType::default(),
                                            )
                                            .await;
                                        }
                                        Err(e) => log::error!(
                                            "An error occurred while retrieving 
                                         results from Unstructured IO response. Error : {}",
                                            e
                                        ),
                                    }
                                    let _ = send_webapp_embed_ready(datasource_id)
                                        .await
                                        .map_err(|e| log::error!("{}", e));
                                }
                                None => {
                                    log::warn!(
                                        "Could not read file from source...source returned NONE!"
                                    )
                                }
                            }
                        }
                    } else {
                        // This is where data is coming from airbyte rather than a direct file upload
                        let _ = send_task(sender, (ds.clone(), stream_config_key, message_string))
                            .await;
                    }
                }
            } else {
                log::error!(
                    "There was no embedding model associated with datasource: {}",
                    datasource_id
                )
            }
        }
        Err(e) => {
            log::error!("Could not find associated datasource: {}", e)
        }
    }
}
