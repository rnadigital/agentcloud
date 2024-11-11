use crate::adaptors::gcp::pubsub::subscribe_to_topic;
use crate::adaptors::mongo::models::DataSources;
use crate::init::env_variables::GLOBAL_DATA;
use crate::messages::models::{MessageQueueConnection, QueueConnectionTypes};
use crate::messages::tasks::process_message;
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
    //vector_database_client: Arc<RwLock<dyn VectorDatabase>>,
    mongo_client: Arc<RwLock<Database>>,
    sender: Sender<(DataSources, Option<String>, String)>,
) {
    if let Ok(mut stream) = stream.try_lock() {
        while let Some(message) = stream.next().await {
            let cloned_message = message.message.clone();
            let message_attributes = cloned_message.attributes;
            println!("Message attributes: {:?}", message_attributes);
            if let Ok(message_string) = String::from_utf8(cloned_message.data) {
                match message_attributes.get("_stream") {
                    Some(stream) => {
                        println!("Stream contents: {}", stream);
                        let stream_string: String = stream.to_string();
                        let (datasource_id, stream_config_key, stream_type) =
                            match message_attributes.get("type") {
                                Some(stream_type_field_value) => {
                                    let stream_split: Vec<&str> =
                                        stream_string.split('_').collect();
                                    let datasource_id = stream_split[0];
                                    let stream_type = Some(stream_type_field_value.to_string());
                                    (datasource_id, None, stream_type)
                                }
                                None => {
                                    let (datasource_id, stream_config_key) = stream_string.split_once('_')
                                        .expect("Expected string to contain an underscore for splitting");
                                    (datasource_id, Some(stream_config_key.to_string()), None)
                                }
                            };
                        //let qdrant_client = Arc::clone(&vector_database_client);
                        let mongo_client = Arc::clone(&mongo_client);
                        let sender = sender.clone();
                        println!("Datasource ID: {}", datasource_id);
                        process_message(
                            message_string,
                            stream_type,
                            datasource_id,
                            stream_config_key,
                            //qdrant_client,
                            mongo_client,
                            sender,
                        )
                        .await;
                    }
                    None => {
                        log::warn!("No stream ID present in message. Can not proceed")
                    }
                }
            } else {
                log::warn!("Could not get message content from PubSub")
            }
            let _ = message.ack().await;
        }
    }
}
