use crate::adaptors::mongo::models::DataSources;
use crate::adaptors::rabbitmq::client::bind_queue_to_exchange;
use crate::init::env_variables::GLOBAL_DATA;
use crate::messages::models::{MessageQueueConnection, QueueConnectionTypes};
use crate::messages::tasks::process_message;
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
    //vector_database_client: Arc<RwLock<dyn VectorDatabase>>,
    mongo_client: Arc<RwLock<Database>>,
    sender: Sender<(DataSources, Option<String>, String)>,
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
                            // Determine stream type and extract datasource_id and stream_config_key
                            let (datasource_id, stream_config_key, stream_type) = match headers
                                .get(&ShortStr::try_from("type").unwrap())
                            {
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
                            if let Some(msg) = message.content {
                                if let Ok(message_string) = String::from_utf8(msg.clone().to_vec())
                                {
                                    let sender_clone = sender.clone();
                                    let mongo_client = Arc::clone(&mongo_client);
                                    process_message(
                                        message_string,
                                        stream_type,
                                        datasource_id,
                                        stream_config_key,
                                        //vector_database_client,
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
            }
        }
    }
}
