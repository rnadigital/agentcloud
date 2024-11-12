use serde::Serialize;
use std::thread::available_parallelism;

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
    pub mongo_db_name: String,
    pub qdrant_host: String,
    pub qdrant_port: String,
    pub webapp_host: String,
    pub webapp_port: String,
    pub redis_host: String,
    pub redis_port: String,
    pub thread_percentage_utilisation: f64,
    pub number_of_threads: f64,
    pub use_gpu: String,
    pub logging_level: String,
    pub message_queue_provider: String,
    pub unstructuredio_url: String,
    pub unstructuredio_api_key: String,
    pub vector_database: String,
    pub vector_database_api_key: String,
    pub vector_database_url: String,
    pub hashing_salt: String,
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
            rabbitmq_username: dotenv::var("RABBITMQ_USERNAME").unwrap_or("agentcloud".to_string()),
            rabbitmq_password: dotenv::var("RABBITMQ_PASSWORD")
                .unwrap_or("alphanumeric123".to_string()),
            mongo_uri: dotenv::var("MONGO_URI").unwrap_or("mongodb://localhost:27017".to_string()),
            mongo_db_name: dotenv::var("MONGO_DB_NAME").unwrap_or("agentcloud".to_string()),
            qdrant_host: dotenv::var("QDRANT_HOST").unwrap_or("http://localhost".to_string()),
            qdrant_port: dotenv::var("QDRANT_PORT").unwrap_or("6334".to_string()),
            webapp_host: dotenv::var("WEBAPP_HOST").unwrap_or("localhost".to_string()),
            webapp_port: dotenv::var("WEBAPP_PORT").unwrap_or("3000".to_string()),
            redis_host: dotenv::var("REDIS_HOST").unwrap_or("localhost".to_string()),
            redis_port: dotenv::var("REDIS_PORT").unwrap_or("6379".to_string()),
            thread_percentage_utilisation: dotenv::var("THREAD_PERCENTAGE_UTILISATION")
                .unwrap_or("1".to_string())
                .parse()
                .unwrap_or(0.8),
            number_of_threads: available_parallelism()
                .map(|t| t.get() as f64)
                .unwrap_or(12.0),
            use_gpu: dotenv::var("USE_GPU").unwrap_or("false".to_string()),
            logging_level: dotenv::var("LOGGING_LEVEL").unwrap_or("debug".to_string()),
            message_queue_provider: dotenv::var("MESSAGE_QUEUE_PROVIDER")
                .unwrap_or("rabbitmq".to_string()),
            unstructuredio_url: dotenv::var("UNSTRUCTURED_API_URL")
                .unwrap_or("http://localhost:9500/general/v0/general".to_string()),
            unstructuredio_api_key: dotenv::var("UNSTRUCTURED_API_KEY").unwrap_or(String::new()),
            vector_database: dotenv::var("VECTOR_DATABASE").unwrap_or("qdrant".to_string()),
            vector_database_api_key: dotenv::var("VECTOR_DATABASE_API_KEY").unwrap_or_default(),
            vector_database_url: dotenv::var("VECTOR_DATABASE_URL").unwrap_or_default(),
            hashing_salt: dotenv::var("HASHING_SALT").unwrap_or("something_secretive".to_string()),
        }
    }
}
