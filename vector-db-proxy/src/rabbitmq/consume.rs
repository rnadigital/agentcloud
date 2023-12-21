use crate::data::processing_incoming_messages::process_messages;
use amiquip::{
    AmqpValue, Channel, ConsumerMessage, ConsumerOptions, ExchangeDeclareOptions, ExchangeType,
    FieldTable, QueueDeclareOptions,
};
use anyhow::Result;
use qdrant_client::client::QdrantClient;
use std::sync::Arc;
use tokio::sync::{Mutex, RwLock};

pub async fn subscribe_to_queue(
    app_data: Arc<Mutex<QdrantClient>>,
    channel: Arc<RwLock<Channel>>,
    exchange_name: &str,
    queue_name: &str,
    routing_key: &str,
) -> Result<()> {
    let channel = channel.read().await;
    let channel_qos = channel.qos(0, 1, false).unwrap();
    let mut arguments = FieldTable::new();
    arguments.insert(
        "x-queue-type".to_string(),
        AmqpValue::LongString("stream".to_string()),
    );
    // Declare the direct exchange we will bind to.
    let options = QueueDeclareOptions {
        durable: true,
        arguments,
        ..QueueDeclareOptions::default()
    };
    let exchange = channel.exchange_declare(
        ExchangeType::Direct,
        exchange_name,
        ExchangeDeclareOptions::default(),
    )?;
    // Declare the exclusive, server-named queue we will use to consume.
    let queue = channel.queue_declare(queue_name, options)?;
    println!("created exclusive queue {}", queue.name());

    // Bind our queue to the logs exchange.
    queue.bind(&exchange, "", FieldTable::new())?;
    let consumer = queue.consume(ConsumerOptions {
        no_ack: false,
        ..ConsumerOptions::default()
    })?;
    for (_, message) in consumer.receiver().iter().enumerate() {
        match message {
            ConsumerMessage::Delivery(delivery) => {
                let headers = delivery.properties.headers().as_ref().unwrap();
                println!("{:?}", headers);
                let body = String::from_utf8_lossy(&delivery.body);
                let qdrant_conn = Arc::clone(&app_data);
                let _ = process_messages(qdrant_conn, body.to_string()).await;
            }
            other => {
                println!("Consumer ended: {:?}", other);
                break;
            }
        }
    }
    Ok(())
}
