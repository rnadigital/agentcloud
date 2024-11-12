use crate::adaptors::mongo::models::DataSources;
use crossbeam::channel::Sender;

/// Adds the incoming task to the execution Queue to be processes when threads are available
pub async fn send_task(
    sender: Sender<(DataSources, Option<String>, String)>,
    params: (DataSources, Option<String>, String),
) {
    let (dataset_id, stream_config_key, message) = params;
    // Instantiate a new instance of the MyQueue
    let _ = sender
        .send((dataset_id, stream_config_key, message))
        .map_err(|err| log::error!("An error occurred while sending task to channel: {}", err));
}
