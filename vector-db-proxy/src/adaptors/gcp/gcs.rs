use anyhow::{anyhow, Result};
use google_cloud_storage::client::{Client, ClientConfig};
use google_cloud_storage::http::objects::download::Range;
use google_cloud_storage::http::objects::get::GetObjectRequest;

pub async fn get_object_from_gcs(bucket: &str, object: &str) -> Result<Vec<u8>> {
    let bucket_name = bucket.to_string();
    let filename = object.to_string();

    let client = match ClientConfig::default().with_auth().await {
        Ok(config) => {
            let client = Client::new(config);
            Ok(client)
        }
        Err(e) => Err(anyhow!(
            "An error occurred while authenticating to GCS. Error: {:?}",
            e
        )),
    };

    return match client
        .unwrap()
        .download_object(
            &GetObjectRequest {
                bucket: bucket_name,
                object: filename,
                ..Default::default()
            },
            &Range::default(),
        )
        .await
    {
        Ok(data) => Ok(data),
        Err(e) => Err(anyhow!(
            "An error occurred while fetching data from GCS. Error: {}",
            e
        )),
    };
}
