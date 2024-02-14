use crate::queue::queuing::{Control, MyQueue};
use qdrant_client::client::QdrantClient;
use std::sync::Arc;
use mongodb::Database;
use tokio::sync::RwLock;

/// Adds the incoming task to the execution Queue to be processes when threads are available
pub async fn add_message_to_embedding_queue(
    queue: Arc<RwLock<MyQueue<String>>>,
    app_data: Arc<RwLock<QdrantClient>>,
    mongo_conn: Arc<RwLock<Database>>,
    params: (String, String),
) {
    println!("Received task to be executed");
    let (dataset_id, table_name) = params;
    // Instantiate a new instance of the MyQueue
    let mut q_guard = queue.write().await;
    // Add task to queue
    q_guard.enqueue(dataset_id);
    // Call associated function to being processing tasks in the queue
<<<<<<< Updated upstream
    q_guard.embed_message(app_data, table_name);
=======
    queue.embed_message(app_data, mongo_conn, table_name);
>>>>>>> Stashed changes
}
