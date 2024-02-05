use anyhow::{anyhow, Result};
use mongodb::bson::doc;
use mongodb::bson::oid::ObjectId;
use mongodb::error::Result as MongoResult;
use mongodb::{Collection, Database};
use std::str::FromStr;

use crate::mongo::models::{DataSources, Model};

pub async fn get_datasource(db: &Database, datasource_id: &str) -> MongoResult<DataSources> {
    let datasources_collection: Collection<DataSources> = db.collection("datasources");
    let datasource = datasources_collection
        .find_one(
            doc! {"_id": ObjectId::from_str(datasource_id).unwrap()},
            None,
        )
        .await?
        .unwrap();

    Ok(datasource)
}

pub async fn get_embedding_model(db: &Database, datasource_id: &str) -> Result<Option<Model>> {
    let datasources_collection = db.collection::<DataSources>("datasources");
    let models_collection = db.collection::<Model>("model");

    // Attempt to find the datasource. If not found or error, handle accordingly.
    match datasources_collection
        .find_one(doc! {"_id": &datasource_id}, None)
        .await
    {
        Ok(Some(datasource)) => {
            // If datasource is found, attempt to find the related model.
            match models_collection
                .find_one(doc! {"_id": datasource.modelId}, None)
                .await
            {
                Ok(model) => Ok(model), // Return the model if found (could be Some or None)
                Err(e) => Err(anyhow!("Failed to find model: {}", e)),
            }
        }
        Ok(None) => Ok(None), // Return None if no datasource is found (so there was no 'error' however there was no datasource model found)
        Err(e) => Err(anyhow!("Failed to find datasource: {}", e)),
    }
}
