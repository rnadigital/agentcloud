use crate::data::processing_incoming_messages::process_messages;
use crate::rabbitmq::client::{bind_queue_to_exchange, channel_rabbitmq, connect_rabbitmq};
use crate::rabbitmq::models::RabbitConnect;
use amqprs::channel::{BasicAckArguments, BasicCancelArguments, BasicConsumeArguments};
use anyhow::Result;
use qdrant_client::client::QdrantClient;
use std::sync::Arc;
use tokio::sync::Mutex;

pub async fn subscribe_to_queue(
    app_data: Arc<Mutex<QdrantClient>>,
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
        println!("Hello");
        if let Some(msg) = message.content {
            let qdrant_conn = Arc::clone(&app_data);
            if let Ok(message_string) = String::from_utf8(msg.clone().to_vec()) {
                let args = BasicAckArguments::new(message.deliver.unwrap().delivery_tag(), false);
                let _ = channel.basic_ack(args).await;
                let _ = process_messages(qdrant_conn, message_string).await;
            }
        }
    }

    // this is what to do when we get an error
    if let Err(e) = channel.basic_cancel(BasicCancelArguments::new(&ctag)).await {
        println!("error {}", e.to_string());
    };
    Ok(())
    // }
}
