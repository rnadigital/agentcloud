use anyhow::Result;
use google_cloud_storage::client::{Client, ClientConfig};
use google_cloud_storage::http::objects::download::Range;
use google_cloud_storage::http::objects::get::GetObjectRequest;

async fn gcs_client() -> Result<Client> {
    let config = ClientConfig::default().with_auth().await.unwrap();
    let client = Client::new(config);

    Ok(client)
}

pub async fn get_object_from_gcs(bucket: String, object: String) -> Result<Vec<u8>> {
    let client = gcs_client().await?;

    let data = client
        .download_object(
            &GetObjectRequest {
                bucket,
                object,
                ..Default::default()
            },
            &Range::default(),
        )
        .await?;

    Ok(data)
}
