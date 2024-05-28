use std::sync::Arc;
use amqp_serde::types::ShortStr;
use futures::StreamExt;

use amqprs::channel::{BasicAckArguments, BasicConsumeArguments, Channel};
use google_cloud_pubsub::subscription::MessageStream;
use mongodb::Database;
use qdrant_client::client::QdrantClient;
use tokio::sync::RwLock;

use crate::gcp::models::PubSubConnect;
use crate::gcp::pubsub::subscribe_to_topic;
use crate::messages::messages::process_message;
use crate::queue::queuing::Pool;
use crate::rabbitmq::client::{bind_queue_to_exchange, channel_rabbitmq, connect_rabbitmq};
use crate::rabbitmq::models::RabbitConnect;
use crate::init::env_variables::GLOBAL_DATA;

pub enum MessageQueueProvider {
    PUBSUB,
    RABBITMQ,
    UNKNOWN,
}

impl From<String> for MessageQueueProvider {
    fn from(value: String) -> Self {
        match value.as_str() {
            "pubsub" => MessageQueueProvider::PUBSUB,
            "rabbitmq" => MessageQueueProvider::RABBITMQ,
            _ => MessageQueueProvider::UNKNOWN
        }
    }
}

pub trait MessageQueue {
    type Queue;
    async fn connect(&self, message_queue_provider: MessageQueueProvider) -> Option<Self::Queue>;
    async fn consume(&self, streaming_queue: Self::Queue, qdrant_client: Arc<RwLock<QdrantClient>>, mongo_client: Arc<RwLock<Database>>, queue: Arc<RwLock<Pool<String>>>, queue_name: &str);
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
                let mut channel = channel_rabbitmq(&connection).await;
                bind_queue_to_exchange(
                    &mut connection,
                    &mut channel,
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
        match channel.basic_consume_rx(args.clone()).await {
            Ok((_, mut messages_rx)) => {
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
            Err(e) => { log::error!("Error consuming message from rabbit: {}", e) }
        }
    }
}


impl MessageQueue for PubSubConnect {
    type Queue = MessageStream;
    async fn connect(&self, message_queue_provider: MessageQueueProvider) -> Option<Self::Queue> {
        let global_data = GLOBAL_DATA.read().await;
        match message_queue_provider {
            MessageQueueProvider::PUBSUB => {
                let pubsub_connection = PubSubConnect {
                    topic: global_data.rabbitmq_stream.clone(),
                    subscription: global_data.rabbitmq_stream.clone(),
                };
                if let Ok(message_stream) = subscribe_to_topic(pubsub_connection).await {
                    return Some(message_stream);
                } else {
                    None
                }
            }
            MessageQueueProvider::RABBITMQ => {
                None
            }
            MessageQueueProvider::UNKNOWN => {
                None
            }
        }
    }

    async fn consume(&self, streaming_queue: Self::Queue, qdrant_client: Arc<RwLock<QdrantClient>>, mongo_client: Arc<RwLock<Database>>, queue: Arc<RwLock<Pool<String>>>, _queue_name: &str) {
        let mut stream = streaming_queue;
        while let Some(message) = stream.next().await {
            println!("Received Message. Processing...");
            let cloned_message = message.message.clone();
            let message_attributes = cloned_message.attributes;
            if let Ok(message_string) = String::from_utf8(cloned_message.data) {
                match message_attributes.get("stream") {
                    Some(stream_id) => {
                        let stream_split: Vec<&str> = stream_id.split('_').collect();
                        let datasource_id = stream_split.to_vec()[0];
                        let mut stream_type: Option<String> = None;
                        match message_attributes.get("type") {
                            Some(t) => {
                                stream_type = Some(t.to_owned());
                            }
                            None => {}
                        }
                        let queue = Arc::clone(&queue);
                        let qdrant_client = Arc::clone(&qdrant_client);
                        let mongo_client = Arc::clone(&mongo_client);
                        process_message(message_string, stream_type, datasource_id, qdrant_client, mongo_client, queue).await;
                    }
                    None => { log::warn!("No stream ID present in message. Can not proceed") }
                }
            }
            let _ = message.ack().await;
        }
    }
}



