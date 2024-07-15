use crossbeam::channel::{Sender};

/// Adds the incoming task to the execution Queue to be processes when threads are available
pub async fn send_task(
    sender: Sender<(String, String)>,
    params: (String, String),
) {
    let (dataset_id, message) = params;
    // Instantiate a new instance of the MyQueue
    let _ = sender.send((dataset_id, message))
        .map_err(|err| log::error!("An error occurred while sending task to channel: {}", err));
}