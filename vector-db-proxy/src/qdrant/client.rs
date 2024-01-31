use crate::init::models::GlobalData;
use anyhow::Result;
use once_cell::sync::Lazy;
use qdrant_client::prelude::*;
use tokio::sync::RwLock;

pub static GLOBAL_DATA: Lazy<RwLock<GlobalData>> = Lazy::new(|| {
    let data: GlobalData = GlobalData::new();
    RwLock::new(data)
});
pub async fn instantiate_qdrant_client() -> Result<QdrantClient> {
    let global_data = GLOBAL_DATA.read().await;
    let client = QdrantClient::from_url(global_data.qdrant_uri.as_str());
    client.build()
}
