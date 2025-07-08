use qdrant_client::client::QdrantClient;

pub async fn build_qdrant_client(
    url: Option<String>,
    api_key: Option<String>,
) -> anyhow::Result<QdrantClient> {
    println!("build_qdrant_client called with url: {:?}, api_key: {:?}", url, api_key);
    
    if let Some(url) = url {
        if url.trim().is_empty() {
            println!("ERROR: Qdrant URL is empty string");
            return Err(anyhow::anyhow!("Qdrant URL is empty string"));
        }
        
        println!("Building Qdrant client with URL: {}", url);
        let client = QdrantClient::from_url(url.as_str()).with_api_key(api_key);
        Ok(client.build()?)
    } else {
        println!("ERROR: No URL was provided for Qdrant host");
        Err(anyhow::anyhow!(
            "No URL was provided for Qdrant host. Can not build client"
        ))
    }
}
