use crate::data::processing_incoming_messages::process_messages;
use crate::gcp::gcs::get_object_from_gcs;
use crate::rabbitmq::client::{bind_queue_to_exchange, channel_rabbitmq, connect_rabbitmq};
use crate::rabbitmq::models::RabbitConnect;
use amqp_serde::types::ShortStr;
use amqprs::channel::{BasicAckArguments, BasicCancelArguments, BasicConsumeArguments};
use anyhow::Result;
use qdrant_client::client::QdrantClient;
use serde_json::Value;
use std::sync::Arc;
use tokio::sync::RwLock;

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
                let qdrant_conn = Arc::clone(&app_data);
                // if the header 'type' is present then assume that it is a file upload. pull from gcs
                if let Ok(message_string) = String::from_utf8(msg.clone().to_vec()) {
                    if let Some(_) = headers.get(&ShortStr::try_from("type").unwrap()) {
                        if let Ok(_json) = serde_json::from_str(message_string.as_str()) {
                            let message_data: Value = _json;
                            if let Some(bucket_name) = message_data.get("") {
                                if let Some(file_name) = message_data.get("") {
                                    if let Ok(file) = get_object_from_gcs(
                                        bucket_name.to_string(),
                                        file_name.to_string(),
                                    )
                                    .await
                                    {
                                        println!("File: {:?}", file);
                                    }
                                }
                            }
                        }
                    }
                    let args =
                        BasicAckArguments::new(message.deliver.unwrap().delivery_tag(), false);
                    let _ = channel.basic_ack(args).await;
                    let _ =
                        process_messages(qdrant_conn, message_string, datasource_id.to_string())
                            .await;
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
