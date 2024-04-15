use anyhow::{anyhow, Result};
use mongodb::bson::doc;
use mongodb::bson::oid::ObjectId;
use mongodb::{Collection, Database};
use std::str::FromStr;
use mongodb::options::{FindOneOptions};

use crate::mongo::models::{DataSources, Model, Credentials, CredentialsObj};

pub async fn get_datasource(db: &Database, datasource_id: &str) -> Result<Option<DataSources>> {
    let datasources_collection: Collection<DataSources> = db.collection("datasources");
    let filter_options = FindOneOptions::builder().projection(doc! {"discoveredSchema": 0, "connectionSettings": 0}).build();
    match datasources_collection
        .find_one(
            doc! {"_id": ObjectId::from_str(datasource_id).unwrap()},
            filter_options,
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

pub async fn get_embedding_model_and_embedding_key(
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


pub async fn get_model_credentials(
    db: &Database,
    datasource_id: &str,
) -> Result<Option<CredentialsObj>> {
    let datasources_collection = db.collection::<DataSources>("datasources");
    let models_collection = db.collection::<Model>("models");
    let credentials_collection = db.collection::<Credentials>("credentials");

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
                Ok(Some(model)) => {
                    match credentials_collection
                        .find_one(doc! {"_id": model.credentialId}, None)
                        .await {
                        Ok(Some(credentials)) => {
                            Ok(credentials.credentials)
                        }
                        Ok(None) => Ok(None),
                        Err(e) => {
                            Err(anyhow!("Failed to find a Credentials object: {}", e))
                        }
                    }
                } // Return the model if found (could be Some or None)
                Ok(None) => Ok(None),
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
