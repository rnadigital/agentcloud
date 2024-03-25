use crate::queue::queuing::{Control, MyQueue};
use mongodb::Database;
use qdrant_client::client::QdrantClient;
use std::sync::Arc;
use tokio::sync::{Mutex, RwLock};
use crate::redis_rs::client::RedisConnection;

/// Adds the incoming task to the execution Queue to be processes when threads are available
pub async fn add_message_to_embedding_queue(
    queue: Arc<RwLock<MyQueue<String>>>,
    qdrant_conn: Arc<RwLock<QdrantClient>>,
    mongo_conn: Arc<RwLock<Database>>,
    redis_conn_pool: Arc<Mutex<RedisConnection>>,
    params: (String, String),
) {
    println!("Received task to be executed");
    let (dataset_id, table_name) = params;
    // Instantiate a new instance of the MyQueue
    let mut q_guard = queue.write().await;
    // Add task to queue
    q_guard.enqueue(dataset_id);
    // Call associated function to being processing tasks in the queue
    q_guard.embed_message(qdrant_conn, mongo_conn, redis_conn_pool, table_name);
}
