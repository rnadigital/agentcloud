use crate::errors::types::CustomErrorType;
use crate::init::models::GlobalData;
use anyhow::{anyhow, Result};
use mongodb::{options::ClientOptions, Client, Database};
use once_cell::sync::Lazy;
use tokio::sync::RwLock;

pub static GLOBAL_DATA: Lazy<RwLock<GlobalData>> = Lazy::new(|| {
    let data: GlobalData = GlobalData::new();
    RwLock::new(data)
});

pub async fn start_mongo_connection() -> Result<Database, CustomErrorType> {
    let global_data = GLOBAL_DATA.read().await;
    let client_options = ClientOptions::parse(global_data.mongo_uri.as_str())
        .await
        .unwrap();
    // Get a handle to the deployment.
    let client = match Client::with_options(client_options) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("Failed to create client: {}", e);
            return Err(CustomErrorType::InternalError(anyhow!(e)));
        }
    };
    // Get a handle to a database.
    let db = client.database("test");
    // List the names of the collections in that database.
    Ok(db)
}
