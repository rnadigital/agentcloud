use crate::adaptors::rabbitmq::client::bind_queue_to_exchange;
use crate::init::env_variables::GLOBAL_DATA;
use crate::messages::models::{MessageQueueConnection, QueueConnectionTypes};
use crate::messages::tasks::process_message;
use crate::vector_databases::vector_database::VectorDatabase;
use amqp_serde::types::ShortStr;
use amqprs::channel::{BasicAckArguments, BasicConsumeArguments, Channel};
use crossbeam::channel::Sender;
use log::{error, warn};
use mongodb::Database;
use std::sync::Arc;
use tokio::sync::RwLock;

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
        )
        .await;
        Some(QueueConnectionTypes::RabbitMQ(channel))
    }
}

pub async fn rabbit_consume(
    streaming_queue: &Channel,
    vector_database_client: Arc<RwLock<dyn VectorDatabase>>,
    mongo_client: Arc<RwLock<Database>>,
    sender: Sender<(String, Option<String>, String)>,
) {
    let global_data = GLOBAL_DATA.read().await;
    let queue_name = global_data.rabbitmq_stream.as_str();
    let args = BasicConsumeArguments::new(queue_name, "");
    loop {
        match streaming_queue.basic_consume_rx(args.clone()).await {
            Ok((_, mut messages_rx)) => {
                while let Some(message) = messages_rx.recv().await {
                    let args =
                        BasicAckArguments::new(message.deliver.unwrap().delivery_tag(), false);
                    let _ = streaming_queue.basic_ack(args).await;
                    let headers = message.basic_properties.unwrap().headers().unwrap().clone();
                    match headers.get(&ShortStr::try_from("stream").unwrap()) {
                        Some(stream) => {
                            let stream_string: String = stream.to_string();
                            let mut stream_type: Option<String> = None;
                            let (datasource_id, stream_config_key) =
                                match headers.get(&ShortStr::try_from("type").unwrap()) {
                                    Some(stream_type_field_value) => {
                                        let stream_split: Vec<&str> =
                                            stream_string.split('_').collect();
                                        stream_type = Some(stream_type_field_value.to_string());
                                        (stream_split.to_vec()[0], None)
                                    }
                                    None => {
                                        let stream_split: (&str, &str) =
                                            stream_string.split_once('_').unwrap();
                                        let datasource_id = stream_split.0;
                                        let stream_config_key = stream_split.1.to_string();
                                        (datasource_id, Some(stream_config_key))
                                    }
                                };
                            if let Some(msg) = message.content {
                                if let Ok(message_string) = String::from_utf8(msg.clone().to_vec())
                                {
                                    let sender_clone = sender.clone();
                                    let vector_database_client =
                                        Arc::clone(&vector_database_client);
                                    let mongo_client = Arc::clone(&mongo_client);
                                    process_message(
                                        message_string,
                                        stream_type,
                                        datasource_id,
                                        stream_config_key,
                                        vector_database_client,
                                        mongo_client,
                                        sender_clone,
                                    )
                                    .await;
                                }
                            }
                        }
                        None => {
                            warn!("There was no stream ID present in message headers...can not proceed!")
                        }
                    }
                }
            }
            Err(e) => {
                error!(
                    "There was an error when consuming messages from rabbitMQ. Error: {}",
                    e
                );
                break; // Break out of the loop to reconnect
            }
        }
    }
    // todo: need to implement reconnection logic
    // // Reconnect on error
    // self.connect(MessageQueueProvider::RABBITMQ).await;
    // // Sleep before retrying to avoid tight loop in case of persistent issues
    // tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
}
