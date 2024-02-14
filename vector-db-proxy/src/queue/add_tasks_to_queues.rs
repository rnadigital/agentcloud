use crate::queue::queuing::{Control, MyQueue};
use qdrant_client::client::QdrantClient;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Adds the incoming task to the execution Queue to be processes when threads are available
pub async fn add_message_to_embedding_queue(
    mut queue: MyQueue<String>,
    app_data: Arc<RwLock<QdrantClient>>,
    params: (String, String),
) {
    println!("Received task to be executed");
    let (dataset_id, table_name) = params;
    // Instantiate a new instance of the MyQueue
    // Add task to queue
    queue.enqueue(dataset_id);
    // Call associated function to being processing tasks in the queue
    queue.embed_message(app_data, table_name);
}
