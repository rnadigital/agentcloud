use crate::data::chunking::{Chunking, ChunkingStrategy, PdfChunker};
use crate::data::processing_incoming_messages::process_messages;
use crate::gcp::gcs::get_object_from_gcs;
use crate::qdrant::utils::Qdrant;
use crate::rabbitmq::client::{bind_queue_to_exchange, channel_rabbitmq, connect_rabbitmq};
use crate::rabbitmq::models::RabbitConnect;

use actix_web::dev::ResourcePath;
use amqp_serde::types::ShortStr;
use amqprs::channel::{BasicAckArguments, BasicCancelArguments, BasicConsumeArguments};
use anyhow::{anyhow, Result};
use qdrant_client::client::QdrantClient;
use qdrant_client::prelude::PointStruct;
use serde_json::{json, Value};
use std::io::Write;
use std::sync::Arc;
use std::{fs, fs::File};
use tokio::sync::RwLock;
use uuid::Uuid;

async fn save_file_to_disk(content: Vec<u8>, file_name: &str) -> Result<()> {
    let file_path = file_name.trim_matches('"');
    println!("File path : {}", file_path);
    let mut file = File::create(file_path)?;
    file.write_all(&*content)?; // handle errors
    Ok(())
}

pub async fn subscribe_to_queue(
    app_data: Arc<RwLock<QdrantClient>>,
    connection_details: RabbitConnect,
    exchange_name: &str,
    queue_name: &str,
    routing_key: &str,
) -> Result<()> {
    // loop {
    let mut connection = connect_rabbitmq(&connection_details).await;
    let mut channel = channel_rabbitmq(&connection).await;
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
    let (ctag, mut messages_rx) = channel.basic_consume_rx(args.clone()).await.unwrap();
    while let Some(message) = messages_rx.recv().await {
        let headers = message.basic_properties.unwrap().headers().unwrap().clone();
        if let Some(stream) = headers.get(&ShortStr::try_from("stream").unwrap()) {
            let stream_string: String = stream.to_string();
            let stream_split: Vec<&str> = stream_string.split("_").collect();
            let datasource_id = stream_split.to_vec()[0];
            if let Some(msg) = message.content {
                // if the header 'type' is present then assume that it is a file upload. pull from gcs
                if let Ok(message_string) = String::from_utf8(msg.clone().to_vec()) {
                    if let Some(_) = headers.get(&ShortStr::try_from("type").unwrap()) {
                        if let Ok(_json) = serde_json::from_str(message_string.as_str()) {
                            let message_data: Value = _json; // this is necessary because  you can not do type annotation inside a if let Ok() expression
                            if let Some(bucket_name) = message_data.get("bucket") {
                                if let Some(file_name) = message_data.get("filename") {
                                    match get_object_from_gcs(
                                        bucket_name.as_str().unwrap(),
                                        file_name.as_str().unwrap(),
                                    )
                                    .await
                                    {
                                        Ok(file) => {
                                            let file_path = format!("{}", file_name);
                                            let pdf = PdfChunker::default();
                                            save_file_to_disk(file, file_path.as_str()).await?;
                                            let (document_text, metadata) = pdf
                                                .extract_text_from_pdf(file_path.as_str())
                                                .expect("TODO: panic message");
                                            match fs::remove_file(
                                                file_path.as_str().trim_matches('"').path(),
                                            ) {
                                                Ok(_) => {
                                                    println!(
                                                        "File: {:?} successfully deleted",
                                                        file_path
                                                    );
                                                }
                                                Err(e) => {
                                                    println!("An error occurred while trying to delete file: {}. Error: {:?}", file_path, e);
                                                    return Err(anyhow!("An error occurred while trying to delete file: {}. Error: {:?}", file_path, e));
                                                }
                                            }
                                            let chunks = pdf
                                                .chunk(
                                                    document_text,
                                                    Some(metadata),
                                                    ChunkingStrategy::SEMANTIC_CHUNKING,
                                                )
                                                .await
                                                .unwrap();
                                            let mut points_to_upload: Vec<PointStruct> = vec![];
                                            for element in chunks.iter() {
                                                let mut metadata =
                                                    element.metadata.clone().unwrap();
                                                metadata.insert(
                                                    "text".to_string(),
                                                    element.page_content.to_string(),
                                                );
                                                let embedding_vector = &element.embedding_vector;
                                                match embedding_vector {
                                                    Some(val) => {
                                                        if !metadata.is_empty() {
                                                            let qdrant_point_struct =
                                                                PointStruct::new(
                                                                    Uuid::new_v4().to_string(),
                                                                    val.to_owned(),
                                                                    json!(metadata)
                                                                        .try_into()
                                                                        .unwrap(),
                                                                );
                                                            points_to_upload
                                                                .push(qdrant_point_struct);
                                                        } else {
                                                            println!("Metadata payload is empty!")
                                                        }
                                                    }
                                                    None => {
                                                        println!("Embedding vector was empty!")
                                                    }
                                                }
                                            }
                                            let qdrant_conn_clone = Arc::clone(&app_data);
                                            let qdrant = Qdrant::new(
                                                qdrant_conn_clone,
                                                datasource_id.to_string(),
                                            );
                                            qdrant.bulk_upsert_data(points_to_upload).await?;
                                        }
                                        Err(e) => println!("Error: {}", e),
                                    }
                                }
                            }
                        }
                    } else {
                        // This is where data is coming from airbyte rather than a direct file upload
                        let qdrant_conn = Arc::clone(&app_data);
                        let args =
                            BasicAckArguments::new(message.deliver.unwrap().delivery_tag(), false);
                        let _ = channel.basic_ack(args).await;
                        let _ = process_messages(
                            qdrant_conn,
                            message_string,
                            datasource_id.to_string(),
                        )
                        .await;
                    }
                }
            }
        } else {
            println!("There was no stream_id in message... can not upload data!");
        }
    }

    // this is what to do when we get an error
    if let Err(e) = channel.basic_cancel(BasicCancelArguments::new(&ctag)).await {
        println!("error {}", e.to_string());
    };

    Ok(())
    // }
}
