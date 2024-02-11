use anyhow::{anyhow, Result};
use mongodb::bson::doc;
use mongodb::bson::oid::ObjectId;
use mongodb::{Collection, Database};
use std::str::FromStr;

use crate::mongo::models::{DataSources, Model};

pub async fn get_datasource(db: &Database, datasource_id: &str) -> Result<Option<DataSources>> {
    let datasources_collection: Collection<DataSources> = db.collection("datasources");
    match datasources_collection
        .find_one(
            doc! {"_id": ObjectId::from_str(datasource_id).unwrap()},
            None,
        )
        .await
    {
        Ok(datasource) => Ok(match datasource {
            Some(d) => return Ok(Some(d)),
            None => None,
        }),
        Err(e) => Err(anyhow!("Some error: {}", e)),
    }
}

pub async fn get_embedding_model(db: &Database, datasource_id: &str) -> Result<Option<Model>> {
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
            // If datasource is found, attempt to find the related model.
            match models_collection
                .find_one(doc! {"_id": datasource.modelId}, None)
                .await
            {
                Ok(model) => Ok(model), // Return the model if found (could be Some or None)
                Err(e) => {
                    println!("Error: {}", e);
                    Err(anyhow!("Failed to find model: {}", e))
                }
            }
        }
        Ok(None) => Ok(None), // Return None if no datasource is found (so there was no 'error' however there was no datasource model found)
        Err(e) => {
            println!("Error: {}", e);
            Err(anyhow!("Failed to find datasource: {}", e))
        }
    }
}
