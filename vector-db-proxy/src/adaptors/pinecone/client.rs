use pinecone_sdk::pinecone::{PineconeClient, PineconeClientConfig};

pub async fn build_pinecone_client(
    url: Option<String>,
    api_key: Option<String>,
) -> anyhow::Result<PineconeClient> {
    let mut client_config = PineconeClientConfig {
        api_key,
        ..Default::default()
    };
    if url.is_none() {
        client_config.control_plane_host = url
    }
    anyhow::Ok(client_config.client()?)
}
