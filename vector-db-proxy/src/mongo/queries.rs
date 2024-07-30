use anyhow::{anyhow, Result};
use mongodb::bson::doc;
use mongodb::bson::oid::ObjectId;
use mongodb::{Collection, Database};
use std::str::FromStr;
use mongodb::options::{FindOneOptions};
use std::time::{SystemTime, UNIX_EPOCH};

use crate::mongo::models::{DataSources, Model};

pub async fn get_datasource(db: &Database, datasource_id: &str) -> Result<Option<DataSources>> {
    let datasources_collection: Collection<DataSources> = db.collection("datasources");
    let filter_options = FindOneOptions::builder().projection(doc! {"discoveredSchema": 0, "connectionSettings": 0}).build();
    if let Ok(object_id) = ObjectId::from_str(datasource_id) {
        match datasources_collection
            .find_one(doc! {"_id": object_id}, filter_options)
            .await
        {
            Ok(Some(datasource)) => Ok(Some(datasource)),
            Ok(None) => Ok(None),
            Err(e) => Err(anyhow!("Some error: {}", e)),
        }
    } else {
        Ok(None)
    }
}

pub async fn get_model(db: &Database, datasource_id: &str) -> Result<Option<Model>> {
    let datasources_collection = db.collection::<DataSources>("datasources");
    let models_collection = db.collection::<Model>("models");
    // Attempt to find the datasource. If not found or error, handle accordingly.
    match datasources_collection
        .find_one(
            doc! {"_id": ObjectId::from_str(datasource_id).unwrap()},
            None,
        )
        .await
    {
        Ok(Some(datasource)) => {
            println!("Datasource retrieved from Mongo: {}", datasource._id);
            // If datasource is found, attempt to find the related model.
            match models_collection
                .find_one(doc! {"_id": datasource.modelId}, None)
                .await
            {
                Ok(model) => Ok(model), // Return the model if found (could be Some or None)
                Err(e) => {
                    log::error!("Error: {}", e);
                    Err(anyhow!("Failed to find model: {}", e))
                }
            }
        }
        Ok(None) => Ok(None), // Return None if no datasource is found (so there was no 'error' however there was no datasource model found)
        Err(e) => {
            log::error!("Error: {}", e);
            Err(anyhow!("Failed to find datasource: {}", e))
        }
    }
}

pub async fn get_model_and_embedding_key(
    db: &Database,
    datasource_id: &str,
) -> Result<(Option<Model>, Option<String>)> {
    let datasources_collection = db.collection::<DataSources>("datasources");
    let models_collection = db.collection::<Model>("models");

    // Attempt to find the datasource. If not found or error, handle accordingly.
    match datasources_collection
        .find_one(
            doc! {"_id": ObjectId::from_str(datasource_id).unwrap()},
            None,
        )
        .await
    {
        Ok(Some(datasource)) => {
            log::debug!("Found datasource: {}", datasource._id);
            // If datasource is found, attempt to find the related model.
            match models_collection
                .find_one(doc! {"_id": datasource.modelId}, None)
                .await
            {
                Ok(model) => Ok((model, datasource.embeddingField)), // Return the model if found (could be Some or None)
                Err(e) => {
                    log::error!("Error: {}", e);
                    Err(anyhow!("Failed to find model: {}", e))
                }
            }
        }
        Ok(None) => {
            log::warn!("Query returned None");
            Ok((None, None))
        } // Return None if no datasource is found (so there was no 'error' however there was no datasource model found)
        Err(e) => {
            log::error!("Error: {}", e);
            Err(anyhow!("Failed to find datasource: {}", e))
        }
    }
}

pub async fn increment_by_one(db: &Database, datasource_id: &str, field_path: &str) -> Result<()> {
    let datasources_collection = db.collection::<DataSources>("datasources");
    let filter = doc! {"_id": ObjectId::from_str(datasource_id).unwrap()};
    let start = SystemTime::now();
	let current_unix_timestamp = start.duration_since(UNIX_EPOCH).unwrap().as_millis() as i64;
    let update = doc! {
        "$inc": { field_path: 1 },
        "$set": { "recordCount.lastUpdated": current_unix_timestamp }
    };
    let update_options = mongodb::options::UpdateOptions::default();
    match datasources_collection.update_one(filter, update, update_options).await {
        Ok(_) => Ok(()),
        Err(e) => {
            log::error!("Error: {}", e);
            Err(anyhow!("Failed to increment variable. Error: {}", e))
        }
    }
}
