use qdrant_client::client::QdrantClient;

pub async fn build_qdrant_client(
    url: Option<String>,
    api_key: Option<String>,
) -> anyhow::Result<QdrantClient> {
    if let Some(url) = url {
        let client = QdrantClient::from_url(url.as_str()).with_api_key(api_key);
        Ok(client.build()?)
    } else {
        Err(anyhow::anyhow!(
            "No URL was provided for Qdrant host. Can not build client"
        ))
    }
}
