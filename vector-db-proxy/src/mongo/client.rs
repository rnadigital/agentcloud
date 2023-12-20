use crate::errors::types::CustomErrorType;
use anyhow::{anyhow, Result};
use mongodb::{options::ClientOptions, Client, Database};

pub async fn start_mongo_connection() -> Result<Database, CustomErrorType> {
    let mongo_url = String::from("mongodb://localhost:27017");
    let client_options = ClientOptions::parse(mongo_url.as_str()).await.unwrap();
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
