use std::sync::Arc;
use google_cloud_pubsub::subscription::MessageStream;
use mongodb::Database;
use qdrant_client::client::QdrantClient;
use tokio::sync::RwLock;
use crate::gcp::pubsub::subscribe_to_topic;
use crate::init::env_variables::GLOBAL_DATA;
use crate::messages::models::{MessageQueue, MessageQueueProvider};
use crate::queue::queuing::Pool;
use futures::StreamExt;
use crate::messages::tasks::process_message;

pub struct PubSubConnect {
    pub topic: String,
    pub subscription: String,
}

impl Default for PubSubConnect {
    fn default() -> Self {
        PubSubConnect {
            topic: String::from("streaming"),
            subscription: String::from("streaming"),
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
                match message_attributes.get("_stream") {
                    Some(datasource_id) => {
                        let mut stream_type: Option<String> = None;
                        if let Some(s) = message_attributes.get("type") { stream_type = Some(s.to_owned()); }
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