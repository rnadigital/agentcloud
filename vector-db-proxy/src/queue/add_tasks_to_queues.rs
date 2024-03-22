use crate::queue::queuing::{MyQueue};
use mongodb::Database;
use qdrant_client::client::QdrantClient;
use std::sync::{Arc};
use tokio::sync::{RwLock, Mutex};
use crate::redis_rs::client::RedisConnection;

/// Adds the incoming task to the execution Queue to be processes when threads are available
pub async fn add_message_to_embedding_queue(
    queue: Arc<RwLock<MyQueue<String>>>,
    qdrant_conn: Arc<RwLock<QdrantClient>>,
    mongo_conn: Arc<RwLock<Database>>,
    redis_conn_pool: Arc<Mutex<RedisConnection>>,
    params: Vec<String>,
) {
    println!("Received task to be executed");
    // let (dataset_id, message) = params;
    // Instantiate a new instance of the MyQueue
    let mut q_guard = queue.write().await;
    // Add task to queue
    q_guard.enqueue(params).await;
    let item = q_guard.dequeue().await.unwrap();
    // Call associated function to being processing tasks in the queue
    q_guard.embed_message(qdrant_conn, mongo_conn, redis_conn_pool, item[0].clone(), item[1].clone()).await;
}
