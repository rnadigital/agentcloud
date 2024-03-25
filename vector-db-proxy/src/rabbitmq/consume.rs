use crate::data::models::FileType;
use crate::gcp::gcs::get_object_from_gcs;
use crate::llm::models::EmbeddingModels;
use crate::mongo::queries::get_datasource;
use crate::utils::webhook::send_webapp_embed_ready;
use crate::mongo::{models::ChunkingStrategy, queries::get_embedding_model};
use crate::qdrant::{helpers::construct_point_struct, utils::Qdrant};
use crate::queue::add_tasks_to_queues::add_message_to_embedding_queue;
use crate::queue::queuing::MyQueue;
use crate::data::utils::{extract_text_from_file, apply_chunking_strategy_to_document};
use crate::utils::file_operations::save_file_to_disk;
use crate::redis_rs::client::RedisConnection;

use amqp_serde::types::ShortStr;
use amqprs::channel::{BasicAckArguments, BasicCancelArguments, BasicConsumeArguments, Channel};
use mongodb::Database;
use qdrant_client::client::QdrantClient;
use qdrant_client::prelude::PointStruct;
use serde_json::Value;
use std::sync::{Arc};
use tokio::sync::{RwLock, Mutex};

pub async fn subscribe_to_queue(
    qdrant_clone: Arc<RwLock<QdrantClient>>,
    queue: Arc<RwLock<MyQueue<String>>>,
    mongo_client: Arc<RwLock<Database>>,
    redis_connection_pool: Arc<Mutex<RedisConnection>>,
    channel: &Channel,
    queue_name: &String,
) {
    // loop {
    let args = BasicConsumeArguments::new(queue_name, "");
    let channel_clone = channel.clone();
    match channel_clone.basic_consume_rx(args.clone()).await {
        Ok((ctag, mut messages_rx)) => {
            loop {
                let mongodb_connection = mongo_client.read().await;
                while let Some(message) = messages_rx.recv().await {
                    let args = BasicAckArguments::new(message.deliver.unwrap().delivery_tag(), false);
                    let _ = channel_clone.basic_ack(args).await;
                    let headers = message.basic_properties.unwrap().headers().unwrap().clone();
                    if let Some(stream) = headers.get(&ShortStr::try_from("stream").unwrap()) {
                        let stream_string: String = stream.to_string();
                        let stream_split: Vec<&str> = stream_string.split('_').collect();
                        let datasource_id = stream_split.to_vec()[0];
                        if let Some(msg) = message.content {
                            // if the header 'type' is present then assume that it is a file upload. pull from gcs
                            if let Ok(message_string) = String::from_utf8(msg.clone().to_vec()) {
                                match get_datasource(&mongodb_connection, datasource_id).await {
                                    Ok(datasource) => {
                                        if let Some(ds) = datasource {
                                            if let Ok(Some(model_parameters)) =
                                                get_embedding_model(&mongodb_connection, datasource_id)
                                                    .await
                                            {
                                                if headers
                                                    .get(&ShortStr::try_from("type").unwrap())
                                                    .is_some()
                                                {
                                                    if let Ok(_json) =
                                                        serde_json::from_str(message_string.as_str())
                                                    {
                                                        let message_data: Value = _json; // this is necessary because  you can not do type annotation inside a if let Ok() expression
                                                        if let Some(bucket_name) =
                                                            message_data.get("bucket")
                                                        {
                                                            if let Some(file_name) =
                                                                message_data.get("filename")
                                                            {
                                                                match get_object_from_gcs(
                                                                    bucket_name.as_str().unwrap(),
                                                                    file_name.as_str().unwrap(),
                                                                )
                                                                    .await
                                                                {
                                                                    Ok(file) => {
                                                                        let datasources_clone = ds.clone();
                                                                        let file_path =
                                                                            format!("{}", file_name);
                                                                        let file_path_split: Vec<&str> =
                                                                            file_path.split(".").collect();
                                                                        let file_extension =
                                                                            file_path_split.to_vec()[1]
                                                                                .to_string()
                                                                                .trim_end_matches('"')
                                                                                .to_string();
                                                                        let file_type =
                                                                            FileType::from(file_extension);
                                                                        // The reason we are choosing to write the file to disk first is to create
                                                                        // parity between running locally and running in cloud
                                                                        save_file_to_disk(
                                                                            file,
                                                                            file_path.as_str(),
                                                                        )
                                                                            .await.unwrap();
                                                                        let message_queue = Arc::clone(&queue);
                                                                        let qdrant_conn = Arc::clone(&qdrant_clone);
                                                                        let mongo_conn = Arc::clone(&mongo_client);
                                                                        let redis_conn = Arc::clone(&redis_connection_pool);
                                                                        let (document_text, metadata) =
                                                                            extract_text_from_file(
                                                                                file_type,
                                                                                file_path.as_str(),
                                                                                ds.originalName,
                                                                                datasource_id.to_string(),
                                                                                message_queue,
                                                                                qdrant_conn,
                                                                                mongo_conn,
                                                                                redis_conn,
                                                                            )
                                                                                .await
                                                                                .unwrap();
                                                                        // dynamically get user's chunking strategy of choice from the database
                                                                        let model_obj_clone =
                                                                            model_parameters.clone();
                                                                        let model_name =
                                                                            model_obj_clone.model;
                                                                        let chunking_character =
                                                                            datasources_clone
                                                                                .chunkCharacter;
                                                                        let chunking_method =
                                                                            datasources_clone
                                                                                .chunkStrategy
                                                                                .unwrap();
                                                                        let chunking_strategy =
                                                                            ChunkingStrategy::from(
                                                                                chunking_method,
                                                                            );
                                                                        match apply_chunking_strategy_to_document(
                                                                            document_text,
                                                                            metadata,
                                                                            chunking_strategy,
                                                                            chunking_character,
                                                                            Some(model_parameters.model),
                                                                        )
                                                                            .await
                                                                        {
                                                                            Ok(chunks) => {
                                                                                let mut points_to_upload: Vec<
                                                                                    PointStruct,
                                                                                > = vec![];
                                                                                for element in chunks.iter() {
                                                                                    let embedding_vector =
                                                                                        &element.embedding_vector;
                                                                                    match embedding_vector {
                                                                                        Some(val) => {
                                                                                            let model = EmbeddingModels::from(model_name.clone());
                                                                                            if let Some(point_struct) =
                                                                                                construct_point_struct(
                                                                                                    val,
                                                                                                    element
                                                                                                        .metadata
                                                                                                        .clone()
                                                                                                        .unwrap(),
                                                                                                    Some(model),
                                                                                                )
                                                                                                    .await
                                                                                            {
                                                                                                points_to_upload
                                                                                                    .push(point_struct)
                                                                                            }
                                                                                        }
                                                                                        None => {
                                                                                            println!(
                                                                                                "Embedding vector was empty!"
                                                                                            )
                                                                                        }
                                                                                    }
                                                                                }
                                                                                let vector_length = model_parameters
                                                                                    .embeddingLength
                                                                                    as u64;
                                                                                let qdrant_conn_clone =
                                                                                    Arc::clone(&qdrant_clone);
                                                                                let qdrant = Qdrant::new(
                                                                                    qdrant_conn_clone,
                                                                                    datasource_id.to_string(),
                                                                                );
                                                                                match qdrant
                                                                                    .bulk_upsert_data(
                                                                                        points_to_upload,
                                                                                        Some(vector_length),
                                                                                        Some(model_name),
                                                                                    )
                                                                                    .await
                                                                                {
                                                                                    Ok(_) => {
                                                                                        println!(
                                                                                            "points uploaded successfully!"
                                                                                        );
                                                                                        if let Err(e) = send_webapp_embed_ready(&datasource_id).await {
                                                                                            println!("Error notifying webapp: {}", e);
                                                                                        } else {
                                                                                            println!("Webapp notified successfully!");
                                                                                        }
                                                                                    }
                                                                                    Err(e) => {
                                                                                        println!("An error occurred while attempting upload to qdrant. Error: {:?}", e);
                                                                                    }
                                                                                }
                                                                            }
                                                                            Err(e) => println!("Error: {}", e),
                                                                        }
                                                                    }
                                                                    Err(e) => println!("Error: {}", e),
                                                                }
                                                            }
                                                        }
                                                    }
                                                } else {
                                                    // This is where data is coming from airbyte rather than a direct file upload
                                                    let message_queue = Arc::clone(&queue);
                                                    let qdrant_conn = Arc::clone(&qdrant_clone);
                                                    let mongo_conn = Arc::clone(&mongo_client);
                                                    let redis_conn = Arc::clone(&redis_connection_pool);
                                                    let _ = add_message_to_embedding_queue(
                                                        message_queue,
                                                        qdrant_conn,
                                                        mongo_conn,
                                                        redis_conn,
                                                        (datasource_id.to_string(), message_string),
                                                    )
                                                        .await;
                                                }
                                            } else {
                                                eprintln!(
                                                    "There was no embedding model associated with datasource: {}",
                                                    datasource_id
                                                )
                                            }
                                        }
                                    }
                                    Err(e) => {
                                        eprintln!("An error occurred while retrieving datasource from the database: {}", e)
                                    }
                                }
                            }
                        }
                    } else {
                        println!("There was no stream_id in message... can not upload data!");
                    }
                }
                // this is what to do when we get an error
                if let Err(e) = channel_clone.basic_cancel(BasicCancelArguments::new(&ctag)).await {
                    println!("error {}", e);
                };
            }
        }
        Err(e) => {
            println!("An error occurred retrieving messages from the stream : {}", e);
        }
    };
}