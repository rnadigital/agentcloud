use anyhow::{anyhow, Result};

use crate::qdrant::models::{CreateDisposition, PointSearchResults};
use crate::routes::models::FilterConditions;
use crate::utils::conversions::convert_hashmap_to_filters;
use qdrant_client::client::QdrantClient;
use qdrant_client::prelude::*;
use qdrant_client::qdrant::vectors_config::Config;
use qdrant_client::qdrant::{
    CreateCollection, Filter, PointId, PointStruct, RecommendPoints, ScoredPoint, VectorParams,
    VectorParamsMap, VectorsConfig,
};
use std::sync::Arc;
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
        println!("Getting list of collection from DB...");
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
        return match &self
            .check_collection_exists(CreateDisposition::CreateNever, None)
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
        };
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
    ) -> Result<bool> {
        println!(
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
            println!("Collection: {} already exists", &self.collection_name);
            Ok(true)
        } else {
            println!(
                "Collection: {} does NOT exist...creating it now",
                &self.collection_name
            );
            let vector_size = vector_length.unwrap_or(512); // Default to fastembed embedding size if none is given;
            match create_disposition {
                CreateDisposition::CreateIfNeeded => {
                    match qdrant_client
                        .create_collection(&CreateCollection {
                            collection_name: self.collection_name.to_owned(),
                            vectors_config: Some(VectorsConfig {
                                config: Some(Config::ParamsMap(VectorParamsMap {
                                    map: [(
                                        String::from("fast-bge-small-en"), //TODO: not hardcode
                                        VectorParams {
                                            size: vector_size, // This is the number of dimensions in the collection (basically the number of columns) //TODO: Need to get this dynamically from database!
                                            distance: Distance::Cosine.into(), // The distance metric we will use in this collection
                                            ..Default::default()
                                        },
                                    )]
                                    .into(),
                                })),
                            }),
                            ..Default::default()
                        })
                        .await
                    {
                        Ok(result) => match result.result {
                            true => {
                                println!(
                                    "Collection: {} created successfully!",
                                    &self.collection_name
                                );
                                Ok(true)
                            }
                            false => {
                                println!("Collection: {} creation failed!", &self.collection_name);
                                Ok(false)
                            }
                        },
                        Err(e) => {
                            println!("Err: {}", e);
                            Err(anyhow!(
                                "An error occurred while trying to create collection: {}",
                                e
                            ))
                        }
                    }
                }
                CreateDisposition::CreateNever => {
                    println!("Collection: {} has a Do Not Create disposition. Therefore will not attempt creations", &self.collection_name);
                    Ok(false)
                }
            }
        }
    }

    ///
    ///
    /// # Arguments
    ///
    /// * `point`: PointStruct to upload to Qdrant
    ///
    /// returns: Result<bool, Error>
    ///
    /// # Examples
    ///
    /// ```
    ///
    /// ```
    pub async fn upsert_data_point(&self, point: PointStruct) -> Result<bool> {
        println!(
            "Uploading data point to collection: {}",
            &self.collection_name
        );
        let qdrant_conn = &self.client.read().await;
        let upsert_results = qdrant_conn
            .upsert_points_blocking(&self.collection_name, None, vec![point], None)
            .await?;
        match upsert_results.result.unwrap().status {
            2 => Ok(true),
            _ => Ok(false),
        }
    }

    pub async fn upsert_data_point_non_blocking(&self, point: PointStruct) -> Result<bool> {
        println!(
            "Uploading data point to collection: {}",
            &self.collection_name
        );
        let qdrant_conn = &self.client.read().await;
        let upsert_results = qdrant_conn
            .upsert_points(&self.collection_name, None, vec![point], None)
            .await?;
        match upsert_results.result.unwrap().status {
            2 => Ok(true),
            _ => Ok(false),
        }
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
    ) -> Result<bool> {
        println!(
            "Uploading bulk data points to collection: {}",
            &self.collection_name
        );
        let qdrant_conn = &self.client.read().await;
        match &self
            .check_collection_exists(CreateDisposition::CreateIfNeeded, vector_length)
            .await
        {
            Ok(result) => match result {
                true => {
                    let result = qdrant_conn
                        .upsert_points_batch_blocking(
                            &self.collection_name,
                            None,
                            points,
                            None,
                            100,
                        )
                        .await?;
                    match result.result.unwrap().status {
                        2 => Ok(true),
                        _ => Ok(false),
                    }
                }
                false => {
                    println!("Collection: {} creation failed!", &self.collection_name);
                    Err(anyhow!("Collection does not exist"))
                }
            },
            Err(e) => {
                println!("Err: {}", e);
                Err(anyhow!(
                    "An error occurred while trying to create collection: {}",
                    e
                ))
            }
        }
    }

    ///
    ///
    /// # Arguments
    ///
    /// * `vector`: A list of float 32
    /// * `filters`: Hashmap comprised of the key value pairs to filter on
    /// * `limit`: The number of results to return from search
    ///
    /// returns: Result<Vec<PointSearchResults, Global>, Error>
    ///
    /// # Examples
    ///
    /// ```
    ///
    /// ```
    pub async fn return_similar_results(
        &self,
        vector: Vec<f32>,
        filters: Option<FilterConditions>,
        limit: Option<u64>,
    ) -> Result<Vec<PointSearchResults>> {
        let qdrant_conn = &self.client.read().await;
        let (must, must_not, should) = convert_hashmap_to_filters(&filters);
        let mut response_data: Vec<PointSearchResults> = vec![];
        let search_result = qdrant_conn
            .search_points(&SearchPoints {
                collection_name: self.collection_name.clone(),
                vector: vector.to_owned(),
                filter: Some(Filter {
                    must,
                    must_not,
                    should,
                }),
                limit: limit.unwrap_or(5),
                with_payload: Some(true.into()),
                ..Default::default()
            })
            .await?;
        for result in &search_result.result {
            let _ = response_data.push(PointSearchResults {
                score: result.score,
                payload: result.payload.to_owned(),
            });
        }
        Ok(response_data)
    }

    ///
    ///
    /// # Arguments
    ///
    /// * `id`: Vector ID
    /// * `filters`: list of filters
    /// * `limit`: limit the number of returned results
    ///
    /// returns: Result<Vec<ScoredPoint, Global>, Error>
    ///
    /// # Examples
    ///
    /// ```
    ///
    /// ```
    pub async fn return_recommendations(
        &self,
        id: String,
        filters: Option<FilterConditions>,
        limit: u64,
    ) -> Result<Vec<ScoredPoint>> {
        let (must, must_not, should) = convert_hashmap_to_filters(&filters);
        let point_id = PointId {
            point_id_options: Some(point_id::PointIdOptions::Uuid(id)),
        };
        let qdrant = &self.client.read().await;
        let recommend = RecommendPoints {
            collection_name: self.collection_name.to_owned(),
            positive: vec![point_id],
            negative: vec![],
            limit,
            filter: Some(Filter {
                must,
                must_not,
                should,
            }),
            score_threshold: Some(0.9),
            ..Default::default()
        };
        match qdrant.recommend(&recommend).await {
            Ok(result) => Ok(result.result),
            Err(e) => {
                tracing::error!("Error occurred: {e}");
                Err(anyhow!("Error occurred: {e}"))
            }
        }
    }
}
