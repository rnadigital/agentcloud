use crate::adaptors::gcp::pubsub::subscribe_to_topic;
use crate::init::env_variables::GLOBAL_DATA;
use crate::messages::models::{MessageQueueConnection, QueueConnectionTypes};
use crate::messages::tasks::process_message;
use crate::vector_databases::vector_database::VectorDatabase;
use crossbeam::channel::Sender;
use futures::StreamExt;
use google_cloud_pubsub::subscription::MessageStream;
use mongodb::Database;
use std::sync::Arc;
use tokio::sync::{Mutex, RwLock};

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
impl MessageQueueConnection for PubSubConnect {
    async fn connect(&self) -> Option<QueueConnectionTypes> {
        let global_data = GLOBAL_DATA.read().await;
        let pubsub_connection = PubSubConnect {
            topic: global_data.rabbitmq_stream.clone(),
            subscription: global_data.rabbitmq_stream.clone(),
        };
        if let Ok(message_stream) = subscribe_to_topic(pubsub_connection).await {
            let stream = Arc::new(Mutex::new(message_stream));
            Some(QueueConnectionTypes::PubSub(stream))
        } else {
            None
        }
    }
}

pub async fn pubsub_consume(
    stream: &Arc<Mutex<MessageStream>>,
    vector_database_client: Arc<RwLock<dyn VectorDatabase>>,
    mongo_client: Arc<RwLock<Database>>,
    sender: Sender<(String, String, String)>,
) {
    if let Ok(mut stream) = stream.try_lock() {
        while let Some(message) = stream.next().await {
            let cloned_message = message.message.clone();
            let message_attributes = cloned_message.attributes;
            if let Ok(message_string) = String::from_utf8(cloned_message.data) {
                match message_attributes.get("_stream") {
                    Some(stream) => {
                        let mut stream_type: Option<String> = None;
                        if let Some(s) = message_attributes.get("type") {
                            stream_type = Some(s.to_owned());
                        }
                        let qdrant_client = Arc::clone(&vector_database_client);
                        let mongo_client = Arc::clone(&mongo_client);
                        let stream_string: String = stream.to_string();
                        let stream_split: (&str, &str) = stream_string.split_once('_').unwrap();
                        let datasource_id = stream_split.0;
                        let stream_config_key = stream_split.1;
                        let sender = sender.clone();
                        process_message(
                            message_string,
                            stream_type,
                            datasource_id,
                            stream_config_key,
                            qdrant_client,
                            mongo_client,
                            sender,
                        )
                        .await;
                    }
                    None => {
                        log::warn!("No stream ID present in message. Can not proceed")
                    }
                }
            }
            let _ = message.ack().await;
        }
    }
}
