use anyhow::Result;
use qdrant_client::prelude::*;

pub async fn instantiate_qdrant_client() -> Result<QdrantClient> {
    let url = String::from("http://qdrant:6334");
    let client = QdrantClient::from_url(url.as_str());
    client.build()
}
