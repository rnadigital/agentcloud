use std::sync::Arc;
use std::time::Duration;

use crate::adaptors::qdrant::models::{CollectionData, CollectionStorageSize, CreateDisposition, PointSearchResults, Status};
use crate::routes::models::FilterConditions;
use crate::utils::conversions::convert_hashmap_to_qdrant_filters;
use anyhow::{anyhow, Result};
use backoff::backoff::Backoff;
use backoff::ExponentialBackoff;
use qdrant_client::client::QdrantClient;
use qdrant_client::prelude::*;
use qdrant_client::qdrant::vectors_config::Config;
use qdrant_client::qdrant::{CreateCollection, Filter, PointId, PointStruct, RecommendPoints, ScoredPoint, VectorParams, VectorParamsMap, VectorsConfig};
use tokio::sync::RwLock;

pub struct Qdrant {
    client: Arc<RwLock<QdrantClient>>,
    collection_name: String,
}

impl Qdrant {
    pub fn new(client: Arc<RwLock<QdrantClient>>, collection_name: String) -> Self {
        Qdrant {
            client,
            collection_name,
        }
    }

    pub async fn get_list_of_collections(&self) -> Result<Vec<String>> {
        log::debug!("Getting list of collection from DB...");
        let qdrant_conn = &self.client.read().await;
        let results = qdrant_conn.list_collections().await?;
        let list_of_collection: Vec<String> = results
            .collections
            .iter()
            .map(|col| col.name.clone())
            .collect();
        Ok(list_of_collection)
    }

    pub async fn delete_collection(&self) -> Result<()> {
        let qdrant_conn = &self.client.read().await;
        match &self
            .check_collection_exists(CreateDisposition::CreateNever, None, None)
            .await
        {
            Ok(r) => match r {
                true => match qdrant_conn.delete_collection(&self.collection_name).await {
                    Ok(result) => match result.result {
                        true => Ok(()),
                        false => Err(anyhow!("Collection could not be deleted!")),
                    },
                    Err(e) => Err(anyhow!(
                        "An error occurred while attempting to delete collection {}. Error: {}",
                        &self.collection_name,
                        e
                    )),
                },
                false => Err(anyhow!(
                    "Collection : {} does not exist",
                    &self.collection_name
                )),
            },
            Err(e) => Err(anyhow!(
                "collection {} does not exist. Error: {}",
                &self.collection_name,
                e
            )),
        }
    }

    ///
    ///
    /// # Arguments
    ///
    /// * `create_disposition`: How to handle situation where collection does not exist.
    /// If create disposition is CREATE_IF_NEEDED collection will be created if not found otherwise
    /// a "Collection does not exist error is returned"
    ///
    /// returns: Result<bool, Error>
    ///
    /// # Examples
    ///
    /// ```
    ///
    /// ```
    pub async fn check_collection_exists(
        &self,
        create_disposition: CreateDisposition,
        vector_length: Option<u64>,
        vector_name: Option<String>,
    ) -> Result<bool> {
        log::debug!(
            "Checking if Collection: {} exists...",
            &self.collection_name
        );
        let qdrant_client = &self.client.read().await;
        let list_of_collections = qdrant_client.list_collections().await?;
        let results = list_of_collections
            .collections
            .into_iter()
            .any(|c| c.name == self.collection_name);
        if results {
            log::debug!("Collection: {} already exists", &self.collection_name);
            Ok(true)
        } else {
            log::debug!(
                "Collection: {} does NOT exist...",
                &self.collection_name
            );
            let vector_size = vector_length.unwrap_or(512); // Default to fastembed embedding size if none is given;
            let mut config: Option<VectorsConfig> = Some(VectorsConfig::default());
            match create_disposition {
                CreateDisposition::CreateIfNeeded => {
                    log::debug!("Creating collection now...");
                    // check if vector name is a value or None
                    match vector_name {
                        Some(name) => {
                            // if it's a value check that it's a known fast embed model variant. If it is treat it as a named vector. Otherwise go down the path of a normal upload.
                            let model_name = name.clone();
                            // case where we model name is None in which case use standard point upload method.
                            config = Some(VectorsConfig {
                                config: Some(Config::ParamsMap(VectorParamsMap {
                                    map: [(
                                        String::from(model_name.as_str()),
                                        VectorParams {
                                            size: vector_size, // This is the number of dimensions in the collection (basically the number of columns)
                                            distance: Distance::Cosine.into(), // The distance metric we will use in this collection
                                            on_disk: Some(true), // Serving vectors from Disk 
                                            ..Default::default()
                                        },
                                    )]
                                        .into(),
                                })),
                            })
                        }
                        None => {
                            config = Some(VectorsConfig {
                                config: Some(Config::Params(VectorParams {
                                    size: vector_size, // This is the number of dimensions in the collection (basically the number of columns)
                                    distance: Distance::Cosine.into(), // The distance metric we will use in this collection
                                    on_disk: Some(true),
                                    ..Default::default()
                                })),
                            });
                        }
                    }
                    match qdrant_client
                        .create_collection(&CreateCollection {
                            collection_name: self.collection_name.to_owned(),
                            vectors_config: config,
                            ..Default::default()
                        })
                        .await
                    {
                        Ok(result) => match result.result {
                            true => {
                                log::debug!(
                                    "Collection: {} created successfully!",
                                    &self.collection_name
                                );
                                Ok(true)
                            }
                            false => {
                                log::debug!("Collection: {} creation failed!", &self.collection_name);
                                Ok(false)
                            }
                        },
                        Err(e) => {
                            log::error!("Error: {}", e);
                            Err(anyhow!(
                            "An error occurred while trying to create collection: {}",
                            e
                            ))
                        }
                    }
                }
                CreateDisposition::CreateNever => {
                    log::debug!("Collection: '{}' has a Do Not Create disposition. Therefore will not attempt creation", &self.collection_name);
                    Ok(false)
                }
            }
        }
    }

    pub async fn upsert_data_points(
        &self,
        point: PointStruct,
    ) -> Result<bool> {
        let qdrant_conn = &self.client.read().await;
        let mut backoff = ExponentialBackoff {
            current_interval: Duration::from_millis(50),
            initial_interval: Duration::from_millis(50),
            max_interval: Duration::from_secs(3),
            max_elapsed_time: Some(Duration::from_secs(60)),
            multiplier: 1.5,
            randomization_factor: 0.5,
            ..ExponentialBackoff::default()
        };
        let retry_result = async {
            loop {
                match qdrant_conn
                    .upsert_points_blocking(
                        &self.collection_name,
                        None,
                        vec![point.clone()], // Ensure point is Clone for retries
                        None,
                    )
                    .await
                {
                    Ok(res) => match res.result {
                        Some(stat) => match stat.status {
                            2 => {
                                log::debug!("Time taken: {}", res.time);
                                log::debug!("Upload success");
                                return Ok(true);
                            }
                            _ => log::warn!("Upload failed, retrying..."),
                        },
                        None => return Err(anyhow!("Results returned None")),
                    },
                    Err(e) => log::error!("Error upserting to Qdrant: {}, retrying...", e),
                }

                if backoff.next_backoff().is_none() {
                    return Err(anyhow!("Reached maximum retry attempts"));
                }

                // Await until the next retry interval
                tokio::time::sleep(backoff.next_backoff().unwrap()).await;
            }
        }.await;

        retry_result
    }

    ///
    ///
    /// # Arguments
    ///
    /// * `points`:
    ///
    /// returns: Result<bool, Error>
    ///
    /// # Examples
    ///
    /// ```
    ///
    /// ```
    pub async fn bulk_upsert_data(
        &self,
        points: Vec<PointStruct>,
        vector_length: Option<u64>,
        vector_name: Option<String>,
    ) -> Result<bool> {
        log::debug!(
            "Uploading bulk data points to collection: {}",
            &self.collection_name
        );
        let qdrant_conn = &self.client.read().await;
        match &self
            .check_collection_exists(
                CreateDisposition::CreateIfNeeded,
                vector_length,
                vector_name,
            )
            .await
        {
            Ok(result) => match result {
                true => {
                    match qdrant_conn
                        .upsert_points_batch_blocking(
                            &self.collection_name,
                            None,
                            points,
                            None,
                            100,
                        )
                        .await
                    {
                        Ok(res) => match res.result {
                            Some(stat) => match stat.status {
                                2 => {
                                    log::debug!("upload success");
                                    Ok(true)
                                }
                                _ => {
                                    log::warn!("Upload failed");
                                    Ok(false)
                                }
                            },
                            None => Err(anyhow!("Results returned None")),
                        },
                        Err(e) => Err(anyhow!("There was an error upserting to qdrant: {}", e)),
                    }
                }
                false => {
                    log::warn!("Collection: {} creation failed!", &self.collection_name);
                    Err(anyhow!("Collection does not exist"))
                }
            },
            Err(e) => {
                log::error!("Error: {}", e);
                Err(anyhow!(
                    "An error occurred while trying to create collection: {}",
                    e
                ))
            }
        }
    }

    pub async fn get_collection_info(
        &self,
    ) -> Result<Option<CollectionData>> {
        let id_clone = self.collection_name.clone();
        let qdrant = &self.client.read().await;
        match qdrant.collection_info(self.collection_name.clone()).await {
            Ok(info_results) => {
                if let Some(info) = info_results.result {
                    let collection_info = CollectionData {
                        status: info.status,
                        indexed_vectors_count: info.indexed_vectors_count,
                        segments_count: info.segments_count,
                        points_count: info.points_count,
                    };
                    Ok(Some(collection_info))
                } else {
                    Ok(None)
                }
            }
            Err(e) => {
                Err(anyhow!("An error occurred while getting info for collection : {}. Error: {}", id_clone, e))
            }
        }
    }

    pub async fn estimate_storage_size(&self, vector_length: usize) -> Option<CollectionStorageSize> {
        if let Ok(collection_info) = &self.get_collection_info().await {
            if let Some(info) = collection_info {
                if let Some(number_of_vectors) = info.points_count {
                    let size = (number_of_vectors as usize * vector_length * 4) as f64 * 1.15;
                    let collection_storage_size = CollectionStorageSize {
                        status: Status::Success,
                        points_count: Some(number_of_vectors),
                        size: Some(size.ceil()),
                        collection_name: self.collection_name.to_owned(),
                    };
                    Some(collection_storage_size)
                } else {
                    None
                }
            } else {
                None
            }
        } else {
            None
        }
    }
}