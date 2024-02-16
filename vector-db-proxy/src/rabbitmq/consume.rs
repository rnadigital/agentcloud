use crate::data::chunking::{Chunking, TextChunker};
use crate::data::models::Document as DocumentModel;
use crate::data::models::FileType;
use crate::gcp::gcs::get_object_from_gcs;
use crate::llm::models::EmbeddingModels;
use crate::mongo::queries::get_datasource;
use crate::mongo::{models::ChunkingStrategy, queries::get_embedding_model};
use crate::qdrant::{helpers::construct_point_struct, utils::Qdrant};
use crate::rabbitmq::client::{bind_queue_to_exchange, channel_rabbitmq, connect_rabbitmq};
use crate::rabbitmq::models::RabbitConnect;

use crate::queue::add_tasks_to_queues::add_message_to_embedding_queue;
use crate::queue::queuing::MyQueue;
use actix_web::dev::ResourcePath;
use amqp_serde::types::ShortStr;
use amqprs::channel::{BasicAckArguments, BasicCancelArguments, BasicConsumeArguments};
use anyhow::{anyhow, Result};
use mongodb::Database;
use qdrant_client::client::QdrantClient;
use qdrant_client::prelude::PointStruct;
use serde_json::Value;
use std::collections::HashMap;
use std::io::Write;
use std::sync::Arc;
use std::{fs, fs::File};
use tokio::sync::RwLock;

async fn extract_text_from_file(
    file_type: FileType,
    file_path: &str,
    document_name: String,
) -> Option<(String, Option<HashMap<String, String>>)> {
    let mut document_text = String::new();
    let mut metadata = HashMap::new();
    let path = file_path.trim_matches('"').path().to_string();
    let chunker = TextChunker::default();
    match file_type {
        FileType::PDF => {
            let path_clone = path.clone();
            (document_text, metadata) = chunker
                .extract_text_from_pdf(path_clone)
                .expect("Could not extract text from PDF file");
        }
        FileType::TXT => {
            let path_clone = path.clone();
            (document_text, metadata) = chunker
                .extract_text_from_txt(path_clone)
                .expect("Could not extract text from TXT file");
        }
        FileType::DOCX => {
            let path_clone = path.clone();
            (document_text, metadata) = chunker
                .extract_text_from_docx(path_clone)
                .expect("Could not extract text from DOCX file");
        }
        FileType::CSV => return None,
        FileType::UNKNOWN => return None,
    }
    // Once we have extracted the text from the file we no longer need the file and there file we delete from disk
    let path_clone = path.clone();
    match fs::remove_file(path_clone) {
        Ok(_) => println!("File: {:?} successfully deleted", file_path),
        Err(e) => println!(
            "An error occurred while trying to delete file: {}. Error: {:?}",
            file_path, e
        ),
    }
    metadata.insert(String::from("document name"), document_name);
    let results = (document_text, Some(metadata));
    Some(results)
}

async fn apply_chunking_strategy_to_document(
    document_text: String,
    metadata: Option<HashMap<String, String>>,
    chunking_strategy: ChunkingStrategy,
    chunking_character: Option<String>,
    embedding_models: Option<String>,
) -> Result<Vec<DocumentModel>> {
    let chunker = TextChunker::default();
    let embedding_model_choice = EmbeddingModels::from(embedding_models.unwrap());
    match chunker
        .chunk(
            document_text,
            metadata,
            chunking_strategy,
            chunking_character,
            embedding_model_choice,
        )
        .await
    {
        Ok(c) => Ok(c),
        Err(e) => Err(anyhow!("An error occurred: {}", e)),
    }
}

async fn save_file_to_disk(content: Vec<u8>, file_name: &str) -> Result<()> {
    let file_path = file_name.trim_matches('"');
    println!("File path : {}", file_path);
    let mut file = File::create(file_path)?;
    file.write_all(&content)?; // handle errors
    Ok(())
}

pub async fn subscribe_to_queue(
    qdrant_clone: Arc<RwLock<QdrantClient>>,
    queue: Arc<RwLock<MyQueue<String>>>,
    mongo_client: Arc<RwLock<Database>>,
    connection_details: RabbitConnect,
    exchange_name: &str,
    queue_name: &str,
    routing_key: &str,
) {
    // loop {
    let mut connection = connect_rabbitmq(&connection_details).await;
    let mut channel = channel_rabbitmq(&connection).await;
    let mongodb_connection = mongo_client.read().await;
    bind_queue_to_exchange(
        &mut connection,
        &mut channel,
        &connection_details,
        exchange_name,
        queue_name,
        routing_key,
    )
        .await;
    let args = BasicConsumeArguments::new(queue_name, "");
    match channel.basic_consume_rx(args.clone()).await {
        Ok((ctag, mut messages_rx)) => {
            loop {
                while let Some(message) = messages_rx.recv().await {
                    let args = BasicAckArguments::new(message.deliver.unwrap().delivery_tag(), false);
                    let _ = channel.basic_ack(args).await;
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
                                                                        let (document_text, metadata) =
                                                                            extract_text_from_file(
                                                                                file_type,
                                                                                file_path.as_str(),
                                                                                ds.originalName,
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
                                                                                        // todo: @Tom make api call here to let webapp know that points have been uploaded to qdrant
                                                                                        println!(
                                                                                            "points uploaded successfully!"
                                                                                        )
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
                                                    let q = Arc::clone(&queue);
                                                    let qdrant_conn = Arc::clone(&qdrant_clone);
                                                    let mongo_conn = Arc::clone(&mongo_client);
                                                    let _ = add_message_to_embedding_queue(
                                                        q,
                                                        qdrant_conn,
                                                        mongo_conn,
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
                if let Err(e) = channel.basic_cancel(BasicCancelArguments::new(&ctag)).await {
                    println!("error {}", e);
                };
            }
        }
        Err(e) => {
            println!("An error occurred retrieving messages from the stream : {}", e);
        }
    };
}
