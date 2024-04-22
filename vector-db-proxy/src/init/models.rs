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
    pub mongo_uri: String,
    pub qdrant_uri: String,
    pub webapp_host: String,
    pub webapp_port: String,
    pub redis_host: String,
    pub redis_port: String,
    pub thread_percentage_utilisation: f64,
    pub use_gpu: String,
    pub logging_level: String
}

impl GlobalData {
    pub fn new() -> Self {
        GlobalData {
            host: dotenv::var("HOST").unwrap_or("0.0.0.0".to_string()),
            port: dotenv::var("PORT").unwrap_or("9001".to_string()),
            rabbitmq_port: dotenv::var("RABBITMQ_PORT")
                .unwrap()
                .parse()
                .unwrap_or(5672),
            rabbitmq_host: dotenv::var("RABBITMQ_HOST").unwrap_or("localhost".to_string()),
            rabbitmq_stream: dotenv::var("RABBITMQ_STREAM").unwrap_or("streaming".to_string()),
            rabbitmq_exchange: dotenv::var("RABBITMQ_EXCHANGE").unwrap_or("agentcloud".to_string()),
            rabbitmq_routing_key: dotenv::var("RABBITMQ_ROUTING_KEY").unwrap_or("key".to_string()),
            rabbitmq_username: dotenv::var("RABBITMQ_USERNAME").unwrap_or("guest".to_string()),
            rabbitmq_password: dotenv::var("RABBITMQ_PASSWORD").unwrap_or("guest".to_string()),
            mongo_uri: dotenv::var("MONGO_URI").unwrap_or("mongodb://localhost:27017".to_string()),
            qdrant_uri: dotenv::var("QDRANT_URI").unwrap_or("http://localhost:6334".to_string()),
            webapp_host: dotenv::var("WEBAPP_HOST").unwrap_or("localhost".to_string()),
            webapp_port: dotenv::var("WEBAPP_PORT").unwrap_or("3000".to_string()),
            redis_host: dotenv::var("REDIS_HOST").unwrap_or("localhost".to_string()),
            redis_port: dotenv::var("REDIS_PORT").unwrap_or("6379".to_string()),
            thread_percentage_utilisation: dotenv::var("THREAD_PERCENTAGE_UTILISATION")
                .unwrap_or("1".to_string()).parse().unwrap_or(0.8),
            use_gpu: dotenv::var("USE_GPU").unwrap_or("true".to_string()),
            logging_level: dotenv::var("LOGGING_LEVEL").unwrap_or("debug".to_string()),
        }
    }
}
