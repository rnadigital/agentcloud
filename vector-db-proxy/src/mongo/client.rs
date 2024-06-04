use crate::errors::types::CustomErrorType;
use anyhow::{anyhow, Result};
use mongodb::{options::ClientOptions, Client, Database};
use crate::init::env_variables::GLOBAL_DATA;

pub async fn start_mongo_connection() -> Result<Database, CustomErrorType> {
    let global_data = GLOBAL_DATA.read().await;
    println!("Connecting to MongoDB at address: '{}'", global_data.mongo_uri);
    let client_options = ClientOptions::parse(global_data.mongo_uri.as_str())
        .await
        .unwrap();
    // Get a handle to the deployment.
    let client = match Client::with_options(client_options) {
        Ok(c) => c,
        Err(e) => {
            println!("Failed to create client: {}", e);
            log::error!("Failed to create client: {}", e);
            return Err(CustomErrorType::InternalError(anyhow!(e)));
        }
    };
    // Get a handle to a database.
    let db = client.database(global_data.mongo_db_name.as_str());
    println!("Mongo Database Name: '{}'", db.name());
    // List the names of the collections in that database.
    Ok(db)
}
