use reqwest::{Client};
use anyhow::{anyhow};
use serde_json::json;
use crate::init::env_variables::GLOBAL_DATA;

pub async fn send_webapp_embed_ready(datasource_id: &str) -> Result<(), anyhow::Error> {
    let global_data = GLOBAL_DATA.read().await;
    let url = format!("http://{}:{}{}", global_data.webapp_host, global_data.webapp_port, "/webhook/embed-successful");

    // Prepare the POST request body
    let body = json!({
        "datasourceId": datasource_id
    });

    // Create a client instance
    let client = Client::new();

    // Make the POST request
    let res = client.post(&url)
        .json(&body)
        .send()
        .await?;

    // Check if the request was successful
    if res.status().is_success() {
        Ok(())
    } else {
        Err(anyhow!("Failed to notify webapp. Status: {}", res.status()))
    }
}
