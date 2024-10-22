use crate::adaptors::mongo::models::{DataSources, EmbeddingConfig, Model, VectorDb};
use anyhow::{anyhow, Result};
use futures_util::StreamExt;
use mongodb::bson::doc;
use mongodb::bson::oid::ObjectId;
use mongodb::options::FindOneOptions;
use mongodb::{Collection, Database};
use std::str::FromStr;
use std::time::{SystemTime, UNIX_EPOCH};

pub async fn get_datasource(db: &Database, datasource_id: &str) -> Result<Option<DataSources>> {
    let datasources_collection: Collection<DataSources> = db.collection("datasources");
    let filter_options = FindOneOptions::builder()
        .projection(doc! {"discoveredSchema": 0, "connectionSettings": 0})
        .build();
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
        .find_one(doc! {"_id": ObjectId::from_str(datasource_id)?}, None)
        .await
    {
        Ok(Some(datasource)) => {
            //println!("Datasource retrieved from Mongo: {}", datasource._id);
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
    stream_config_key: Option<String>,
) -> Result<EmbeddingConfig> {
    let datasources_collection = db.collection::<DataSources>("datasources");
    let models_collection = db.collection::<Model>("models");
    let mut embedding_config = EmbeddingConfig::default();

    // Fetch the datasource
    let datasource = match datasources_collection
        .find_one(doc! {"_id": ObjectId::from_str(datasource_id)?}, None)
        .await
    {
        Ok(Some(ds)) => ds,
        Ok(None) => {
            log::warn!("Datasource not found for ID: {}", datasource_id);
            return Ok(embedding_config);
        }
        Err(e) => {
            log::error!("Failed to find datasource: {}", e);
            return Err(anyhow!("Failed to find datasource: {}", e));
        }
    };

    log::debug!("Found datasource: {}", datasource._id);

    // Fetch the model
    let model = match models_collection
        .find_one(doc! {"_id": datasource.modelId}, None)
        .await
    {
        Ok(m) => m,
        Err(e) => {
            log::error!("Failed to find model: {}", e);
            return Err(anyhow!("Failed to find model: {}", e));
        }
    };

    embedding_config.model = model;
    embedding_config.embedding_key = datasource.embeddingField;
    embedding_config.chunking_strategy = datasource.chunkingConfig;

    // Populate primary key if stream config exists
    if let Some(stream_config) = datasource.streamConfig {
        if let Some(config_key) = stream_config_key {
            if let Some(datasource_stream_config) = stream_config.get(config_key.as_str()) {
                embedding_config.primary_key = Some(datasource_stream_config.primaryKey.clone());
            }
        }
    }

    Ok(embedding_config)
}

pub async fn increment_by_one(db: &Database, datasource_id: &str, field_path: &str) -> Result<()> {
    let datasources_collection = db.collection::<DataSources>("datasources");
    let filter = doc! {"_id": ObjectId::from_str(datasource_id)?};
    let start = SystemTime::now();
    let current_unix_timestamp = start.duration_since(UNIX_EPOCH)?.as_millis() as i64;
    let update = doc! {
        "$inc": { field_path: 1 },
        "$set": { "recordCount.lastUpdated": current_unix_timestamp }
    };
    let update_options = mongodb::options::UpdateOptions::default();
    match datasources_collection
        .update_one(filter, update, update_options)
        .await
    {
        Ok(_) => Ok(()),
        Err(e) => {
            log::error!("Error: {}", e);
            Err(anyhow!("Failed to increment variable. Error: {}", e))
        }
    }
}

pub async fn set_record_count_total(db: &Database, datasource_id: &str, total: i32) -> Result<()> {
    let datasources_collection = db.collection::<DataSources>("datasources");
    let filter = doc! {"_id": ObjectId::from_str(datasource_id)?};
    let update = doc! {
        "$set": {
            "recordCount.total": total,
            "status": "embedding",
            "recordCount.success": 0,
            "recordCount.failure":0
        },
    };
    let update_options = mongodb::options::UpdateOptions::default();
    match datasources_collection
        .update_one(filter, update, update_options)
        .await
    {
        Ok(_) => Ok(()),
        Err(e) => {
            log::error!("Error: {}", e);
            Err(anyhow!("Failed to increment variable. Error: {}", e))
        }
    }
}

pub async fn set_datasource_state(db: &Database, datasource_id: &str, state: &str) -> Result<()> {
    let datasources_collection = db.collection::<DataSources>("datasources");
    let filter = doc! {"_id": ObjectId::from_str(datasource_id)?};
    match datasources_collection
        .update_one(
            filter,
            doc! {"$set": {"status": state}},
            mongodb::options::UpdateOptions::default(),
        )
        .await
    {
        Ok(_) => Ok(()),
        Err(e) => {
            log::error!("Error: {}", e);
            Err(anyhow!("Failed to increment variable. Error: {}", e))
        }
    }
}

pub async fn incremental_total_record_count(
    db: &Database,
    datasource_id: &str,
    amount: i32,
) -> Result<()> {
    let datasources_collection = db.collection::<DataSources>("datasources");
    let filter = doc! {"_id": ObjectId::from_str(datasource_id)?};
    let update = doc! {
        "$inc": {
            "recordCount.total": amount,
        },
    };
    let update_options = mongodb::options::UpdateOptions::default();
    match datasources_collection
        .update_one(filter, update, update_options)
        .await
    {
        Ok(_) => Ok(()),
        Err(e) => {
            log::error!("Error: {}", e);
            Err(anyhow!("Failed to increment total count. Error: {}", e))
        }
    }
}

pub async fn get_team_datasources(db: &Database, team_id: &str) -> Result<Vec<DataSources>> {
    let mut list_of_datasources: Vec<DataSources> = vec![];
    let datasources_collection = db.collection::<DataSources>("datasources");
    let filter = doc! {"teamId": ObjectId::from_str(team_id)?};
    match datasources_collection.find(filter, None).await {
        Ok(mut datasources) => {
            while let Some(datasource) = datasources.next().await {
                list_of_datasources.push(datasource?)
            }
        }
        Err(e) => {
            log::error!(
                "Encountered an error when retrieving list of datasources for team: {}. \
            Error: {}",
                team_id,
                e
            );
        }
    };
    Ok(list_of_datasources)
}

pub async fn get_vector_db_details(db: &Database, team_id: &str) -> Result<Vec<VectorDb>> {
    let mut list_of_vector_db_config: Vec<VectorDb> = vec![];
    let vector_db_collections = db.collection::<VectorDb>("vectordb");
    let filter = doc! {"teamId": ObjectId::from_str(team_id)?};
    match vector_db_collections.find(filter, None).await {
        Ok(mut vector_dbs) => {
            while let Some(vector_db) = vector_dbs.next().await {
                list_of_vector_db_config.push(vector_db?)
            }
        }
        Err(e) => {
            log::error!(
                "Encountered an error when retrieving list of vector Databases for team: {}. \
            Error: {}",
                team_id,
                e
            );
        }
    }
    Ok(list_of_vector_db_config)
}
