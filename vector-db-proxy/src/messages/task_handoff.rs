
use std::sync::Arc;
use crossbeam::channel::{Sender};
use tokio::sync::RwLock;

/// Adds the incoming task to the execution Queue to be processes when threads are available
pub async fn send_task(
    sender: Arc<RwLock<Sender<(String, String)>>>,
    params: (String, String),
) {
    println!("Sending task to channel");
    let (dataset_id, message) = params;
    // Instantiate a new instance of the MyQueue
    let sender = sender.read().await.clone();
    sender.send((dataset_id, message)).unwrap()
}