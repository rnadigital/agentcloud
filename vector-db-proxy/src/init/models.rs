use serde::Serialize;

#[derive(Clone, Serialize, Debug, Default)]
pub struct GlobalData {
    pub port: String,
    pub host: String,
    pub rabbitmq_host: String,
    pub rabbitmq_port: u16,
    pub rabbitmq_stream: String,
    pub rabbitmq_exchange: String,
    pub rabbitmq_routing_key: String,
    pub rabbitmq_username: String,
    pub rabbitmq_password: String,
}

impl GlobalData {
    pub fn new() -> Self {
        GlobalData {
            host: dotenv::var("HOST").unwrap_or("".to_string()),
            port: dotenv::var("PORT").unwrap_or("".to_string()),
            rabbitmq_port: dotenv::var("RABBITMQ_PORT").unwrap().parse().unwrap_or(5672),
            rabbitmq_host: dotenv::var("RABBITMQ_HOST").unwrap_or("".to_string()),
            rabbitmq_stream: dotenv::var("RABBITMQ_STREAM").unwrap_or("".to_string()),
            rabbitmq_exchange: dotenv::var("RABBITMQ_EXCHANGE").unwrap_or("".to_string()),
            rabbitmq_routing_key: dotenv::var("RABBITMQ_ROUTING_KEY").unwrap_or("".to_string()),
            rabbitmq_username: dotenv::var("RABBITMQ_USERNAME").unwrap_or("".to_string()),
            rabbitmq_password: dotenv::var("RABBITMQ_PASSWORD").unwrap_or("".to_string()),
        }
    }
}
