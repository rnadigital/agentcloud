use qdrant_client::client::{QdrantClient, QdrantClientConfig};

pub async fn build_qdrant_client(
    url: Option<String>,
    api_key: Option<String>,
) -> anyhow::Result<QdrantClient> {
    if let Some(url) = url {
        let client_config = QdrantClientConfig {
            uri: url,
            api_key,
            ..Default::default()
        };
        let client = QdrantClient::new(Some(client_config))?;
        Ok(client.cfg.build()?)
    } else {
        Err(anyhow::anyhow!(
            "No URL was provided for Qdrant host. Can not build client"
        ))
    }
}
