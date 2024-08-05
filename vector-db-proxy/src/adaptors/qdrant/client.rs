use anyhow::Result;
use qdrant_client::prelude::*;
use crate::init::env_variables::GLOBAL_DATA;

pub async fn instantiate_qdrant_client() -> Result<QdrantClient> {
    let global_data = GLOBAL_DATA.read().await;
    let qdrant_uri = format!("{}:{}", global_data.qdrant_host, global_data.qdrant_port);
    let client = QdrantClient::from_url(qdrant_uri.as_str());
    client.build()
}
