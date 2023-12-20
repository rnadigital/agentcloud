use anyhow::Result;
use qdrant_client::prelude::*;

pub async fn instantiate_qdrant_client() -> Result<QdrantClient> {
    let url = String::from("http://127.0.0.1:6334");
    let client = QdrantClient::from_url(url.as_str());
    client.build()
}
