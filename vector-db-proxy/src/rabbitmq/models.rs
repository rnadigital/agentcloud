use std::sync::Arc;
use amqp_serde::types::ShortStr;
use amqprs::channel::{BasicAckArguments, BasicConsumeArguments, Channel};
use mongodb::Database;
use qdrant_client::client::QdrantClient;
use tokio::sync::{RwLock};
use crate::init::env_variables::GLOBAL_DATA;
use crate::messages::tasks::process_message;
use crate::messages::models::{MessageQueueConnection, QueueConnectionTypes};
use crate::queue::queuing::Pool;
use crate::rabbitmq::client::{bind_queue_to_exchange};
use log::{warn, error};

pub struct RabbitConnect {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
}


impl Default for RabbitConnect {
    fn default() -> Self {
        RabbitConnect {
            host: String::from("localhost"),
            port: 5672,
            username: String::from("guest"),
            password: String::from("guest"),
        }
    }
}
impl MessageQueueConnection for RabbitConnect {
    async fn connect(&self) -> Option<QueueConnectionTypes> {
        let global_data = GLOBAL_DATA.read().await;
        let rabbitmq_connection_details = RabbitConnect {
            host: global_data.rabbitmq_host.clone(),
            port: global_data.rabbitmq_port,
            username: global_data.rabbitmq_username.clone(),
            password: global_data.rabbitmq_password.clone(),
        };

        let channel = bind_queue_to_exchange(
            &rabbitmq_connection_details,
            &global_data.rabbitmq_exchange,
            &global_data.rabbitmq_stream,
            &global_data.rabbitmq_routing_key,
        ).await;
        return Some(QueueConnectionTypes::RabbitMQ(channel));
    }
}

pub async fn rabbit_consume(
    streaming_queue: &Channel,
    qdrant_client: Arc<RwLock<QdrantClient>>,
    mongo_client: Arc<RwLock<Database>>,
    queue: Arc<RwLock<Pool<String>>>,
    queue_name: String,
) {
    let args = BasicConsumeArguments::new(queue_name.as_str(), "");
    loop {
        match streaming_queue.basic_consume_rx(args.clone()).await {
            Ok((_, mut messages_rx)) => {
                while let Some(message) = messages_rx.recv().await {
                    let args = BasicAckArguments::new(message.deliver.unwrap().delivery_tag(), false);
                    let _ = streaming_queue.basic_ack(args).await;
                    let headers = message.basic_properties.unwrap().headers().unwrap().clone();
                    match headers.get(&ShortStr::try_from("stream").unwrap()) {
                        Some(stream) => {
                            let stream_string: String = stream.to_string();
                            let stream_split: Vec<&str> = stream_string.split('_').collect();
                            let datasource_id = stream_split.to_vec()[0];
                            if let Some(msg) = message.content {
                                if let Ok(message_string) = String::from_utf8(msg.clone().to_vec()) {
                                    let mut stream_type: Option<String> = None;
                                    let stream_type_field_value = headers.get(&ShortStr::try_from("type").unwrap());
                                    if let Some(s) = stream_type_field_value { stream_type = Some(s.to_string()); }
                                    let queue = Arc::clone(&queue);
                                    let qdrant_client = Arc::clone(&qdrant_client);
                                    let mongo_client = Arc::clone(&mongo_client);
                                    process_message(message_string, stream_type, datasource_id, qdrant_client, mongo_client, queue).await;
                                }
                            }
                        }
                        None => { warn!("There was no stream ID present in message headers...can not proceed!") }
                    }
                }
            }
            Err(e) => {
                error!("There was an error when consuming messages from rabbitMQ. Error: {}", e);
                break; // Break out of the loop to reconnect
            }
        }
    }
    // // Reconnect on error
    // self.connect(MessageQueueProvider::RABBITMQ).await;
    // // Sleep before retrying to avoid tight loop in case of persistent issues
    // tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
}
