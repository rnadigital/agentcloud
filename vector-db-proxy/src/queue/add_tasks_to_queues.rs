use crate::queue::queuing::Pool;
use mongodb::Database;
use qdrant_client::client::QdrantClient;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Adds the incoming task to the execution Queue to be processes when threads are available
pub async fn add_message_to_embedding_queue(
    queue: Arc<RwLock<Pool<String>>>,
    qdrant_conn: Arc<RwLock<QdrantClient>>,
    mongo_conn: Arc<RwLock<Database>>,
    params: (String, String),
) {
    let (dataset_id, table_name) = params;
    // Instantiate a new instance of the MyQueue
    let mut q_guard = queue.write().await;
    log::debug!("Queue has size: {}", q_guard.q.len());
    // Add task to queue
    q_guard.enqueue(dataset_id);
    // Call associated function to being processing tasks in the queue
    q_guard.embed_message(qdrant_conn, mongo_conn, table_name);
}