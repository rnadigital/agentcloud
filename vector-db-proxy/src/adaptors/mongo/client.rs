use crate::adaptors::mongo::error::CustomMongoError;
use crate::init::env_variables::GLOBAL_DATA;
use anyhow::{anyhow, Result};
use mongodb::{options::ClientOptions, Client, Database};

pub async fn start_mongo_connection() -> Result<Database, CustomMongoError> {
    let global_data = GLOBAL_DATA.read().await;
    let client_options = ClientOptions::parse(global_data.mongo_uri.as_str()).await?;
    // Get a handle to the deployment.
    let client = match Client::with_options(client_options) {
        Ok(c) => c,
        Err(e) => {
            println!("Failed to create client: {}", e);
            log::error!("Failed to create client: {}", e);
            return Err(CustomMongoError::InternalError(anyhow!(e)));
        }
    };
    // Get a handle to a database.
    let db = client.database(global_data.mongo_db_name.as_str());
    Ok(db)
}
