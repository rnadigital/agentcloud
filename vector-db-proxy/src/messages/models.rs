use std::sync::Arc;
use mongodb::Database;
use qdrant_client::client::QdrantClient;
use tokio::sync::RwLock;
use crate::queue::queuing::Pool;
use async_trait::async_trait;
#[derive(Clone, Copy, Debug)]
pub enum MessageQueueProvider {
    PUBSUB,
    RABBITMQ,
    UNKNOWN,
}

impl From<String> for MessageQueueProvider {
    fn from(value: String) -> Self {
        match value.as_str() {
            "google" => MessageQueueProvider::PUBSUB,
            "rabbitmq" => MessageQueueProvider::RABBITMQ,
            _ => MessageQueueProvider::UNKNOWN
        }
    }
}
#[async_trait]
pub trait MessageQueueConnection {
    type Connection;
    async fn connect(&self, message_queue_provider: MessageQueueProvider) -> Option<Self::Connection>;
}
#[async_trait]
pub trait MessageQueue {
    type Queue;
    async fn consume(&self, streaming_queue: Self::Queue, qdrant_client: Arc<RwLock<QdrantClient>>, mongo_client: Arc<RwLock<Database>>, queue: Arc<RwLock<Pool<String>>>, queue_name: &str);
}






