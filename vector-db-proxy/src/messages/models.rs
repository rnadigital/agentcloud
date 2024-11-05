use std::sync::Arc;

use amqprs::channel::Channel;
use crossbeam::channel::Sender;
use google_cloud_pubsub::subscription::MessageStream;
use mongodb::Database;
use tokio::sync::{Mutex, RwLock};

use crate::adaptors::gcp::models::pubsub_consume;
use crate::adaptors::mongo::models::DataSources;
use crate::adaptors::rabbitmq::models::rabbit_consume;

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
            _ => MessageQueueProvider::UNKNOWN,
        }
    }
}
pub enum QueueConnectionTypes {
    PubSub(Arc<Mutex<MessageStream>>),
    RabbitMQ(Channel),
}

impl Clone for QueueConnectionTypes {
    fn clone(&self) -> Self {
        match self {
            QueueConnectionTypes::PubSub(stream) => {
                QueueConnectionTypes::PubSub(Arc::clone(stream))
            }
            QueueConnectionTypes::RabbitMQ(channel) => {
                QueueConnectionTypes::RabbitMQ(channel.clone())
            }
        }
    }
}
impl MessageQueue for QueueConnectionTypes {
    type Queue = Self;

    async fn consume(
        &self,
        streaming_queue: Self::Queue,
        //vector_database_client: Arc<RwLock<dyn VectorDatabase>>,
        mongo_client: Arc<RwLock<Database>>,
        sender: Sender<(DataSources, Option<String>, String)>,
    ) {
        match streaming_queue {
            QueueConnectionTypes::PubSub(stream) => {
                pubsub_consume(&stream, mongo_client, sender).await;
            }
            QueueConnectionTypes::RabbitMQ(channel) => {
                rabbit_consume(&channel, mongo_client, sender).await;
            }
        }
    }
}

pub trait MessageQueueConnection {
    async fn connect(&self) -> Option<QueueConnectionTypes>;
}
pub trait MessageQueue {
    type Queue;
    async fn consume(
        &self,
        streaming_queue: Self::Queue,
        //vector_database_client: Arc<RwLock<dyn VectorDatabase>>,
        mongo_client: Arc<RwLock<Database>>,
        sender: Sender<(DataSources, Option<String>, String)>,
    );
}
