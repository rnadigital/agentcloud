use std::sync::Arc;
use amqp_serde::types::ShortStr;
use amqprs::channel::{BasicAckArguments, BasicConsumeArguments, Channel};
use mongodb::Database;
use qdrant_client::client::QdrantClient;
use tokio::sync::RwLock;
use crate::init::env_variables::GLOBAL_DATA;
use crate::messages::tasks::process_message;
use crate::messages::models::{MessageQueue, MessageQueueProvider};
use crate::queue::queuing::Pool;
use crate::rabbitmq::client::{bind_queue_to_exchange, connect_rabbitmq};

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


impl MessageQueue for RabbitConnect {
    type Queue = Channel;
    async fn connect(&self, message_queue_provider: MessageQueueProvider) -> Option<Self::Queue> {
        let global_data = GLOBAL_DATA.read().await;
        match message_queue_provider {
            MessageQueueProvider::PUBSUB => {
                None
            }
            MessageQueueProvider::RABBITMQ => {
                let rabbitmq_connection_details = RabbitConnect {
                    host: global_data.rabbitmq_host.clone(),
                    port: global_data.rabbitmq_port.clone(),
                    username: global_data.rabbitmq_username.clone(),
                    password: global_data.rabbitmq_password.clone(),
                };
                let mut connection = connect_rabbitmq(&rabbitmq_connection_details).await;
                let channel = bind_queue_to_exchange(
                    &mut connection,
                    &rabbitmq_connection_details,
                    &global_data.rabbitmq_exchange,
                    &global_data.rabbitmq_stream,
                    &global_data.rabbitmq_routing_key,
                )
                    .await;
                Some(channel)
            }
            MessageQueueProvider::UNKNOWN => {
                None
            }
        }
    }

    async fn consume(&self, streaming_queue: Self::Queue, qdrant_client: Arc<RwLock<QdrantClient>>, mongo_client: Arc<RwLock<Database>>, queue: Arc<RwLock<Pool<String>>>, queue_name: &str) {
        let channel = streaming_queue;
        let args = BasicConsumeArguments::new(queue_name, "");
        loop {
            while let Ok((_, mut messages_rx)) = channel.basic_consume_rx(args.clone()).await {
                while let Some(message) = messages_rx.recv().await {
                    let args = BasicAckArguments::new(message.deliver.unwrap().delivery_tag(), false);
                    let _ = channel.basic_ack(args).await;
                    let headers = message.basic_properties.unwrap().headers().unwrap().clone();
                    println!("RabbitMQ Message Headers: {:?}", headers);
                    if let Some(stream) = headers.get(&ShortStr::try_from("stream").unwrap()) {
                        let stream_string: String = stream.to_string();
                        let stream_split: Vec<&str> = stream_string.split('_').collect();
                        let datasource_id = stream_split.to_vec()[0];
                        if let Some(msg) = message.content {
                            if let Ok(message_string) = String::from_utf8(msg.clone().to_vec()) {
                                let mut stream_type: Option<String> = None;
                                let stream_type_field_value = headers.get(&ShortStr::try_from("type").unwrap());
                                {
                                    match stream_type_field_value {
                                        Some(s) => {
                                            stream_type = Some(s.to_string());
                                        }
                                        _ => {}
                                    }
                                    let queue = Arc::clone(&queue);
                                    let qdrant_client = Arc::clone(&qdrant_client);
                                    let mongo_client = Arc::clone(&mongo_client);
                                    process_message(message_string, stream_type, datasource_id, qdrant_client, mongo_client, queue).await;
                                }
                            }
                        } else {
                            log::warn!("There was no stream_id in message... can not upload data!");
                        }
                    }
                }
            }
        }
    }
}