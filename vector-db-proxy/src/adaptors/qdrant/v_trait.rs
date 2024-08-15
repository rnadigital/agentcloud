use crate::adaptors::qdrant::helpers::{construct_point_struct, get_next_page, get_scroll_results};
use crate::utils::conversions::convert_hashmap_to_qdrant_filters;
use crate::vector_dbs::models::{
    CollectionCreate, CollectionMetadata, CollectionsResult, Point, ScrollResults, SearchRequest,
    SearchResult, StorageSize, VectorDatabaseError, VectorDatabaseStatus,
};
use crate::vector_dbs::vector_database::VectorDatabase;
use anyhow::anyhow;
use backoff::backoff::Backoff;
use backoff::ExponentialBackoff;
use google_cloud_gax::grpc::async_trait;
use qdrant_client::prelude::point_id::PointIdOptions;
use qdrant_client::prelude::{CreateCollection, PointStruct, QdrantClient, SearchPoints};
use qdrant_client::qdrant::vectors_config::Config;
use qdrant_client::qdrant::with_vectors_selector::SelectorOptions;
use qdrant_client::qdrant::{
    Filter, PointId, ScrollPoints, VectorParams, VectorParamsMap, VectorsConfig,
    WithVectorsSelector,
};
use std::time::Duration;

#[async_trait]
impl VectorDatabase for QdrantClient {
    type Database = QdrantClient;
    async fn connect(&self, uri: &str) -> Self {
        let client = QdrantClient::from_url(uri);
        client.build().unwrap()
    }

    async fn get_list_of_collections(
        &self,
        client: &Self,
    ) -> Result<Vec<String>, VectorDatabaseError> {
        let results = client.list_collections().await?;
        let list_of_collection: Vec<String> = results
            .collections
            .iter()
            .map(|col| col.name.clone())
            .collect();
        Ok(list_of_collection)
    }

    async fn check_collection_exists(
        &self,
        client: &Self,
        search_request: SearchRequest,
    ) -> Result<CollectionsResult, VectorDatabaseError> {
        let collection_id = search_request.collection;
        match client.collection_exists(collection_id.clone()).await {
            Ok(collection_exists) => match collection_exists {
                true => Ok(CollectionsResult {
                    status: VectorDatabaseStatus::Ok,
                    collection_name: collection_id,
                    collection_metadata: None,
                }),
                false => Ok(CollectionsResult {
                    status: VectorDatabaseStatus::NotFound,
                    collection_name: collection_id,
                    collection_metadata: None,
                }),
            },
            Err(e) => Err(VectorDatabaseError::AnyhowError(e)),
        }
    }

    async fn create_collection(
        &self,
        client: &Self,
        collection_create: CollectionCreate,
    ) -> Result<VectorDatabaseStatus, VectorDatabaseError> {
        let mut config: Option<VectorsConfig> = Some(VectorsConfig::default());
        match collection_create.vector_name {
            Some(name) => {
                // if it's a value check that it's a known fast embed model variant. If it is treat it as a named vector. Otherwise go down the path of a normal upload.
                let model_name = name.clone();
                // case where we model name is None in which case use standard point upload method.
                config = Some(VectorsConfig {
                    config: Some(Config::ParamsMap(VectorParamsMap {
                        map: [(
                            String::from(model_name.as_str()),
                            VectorParams {
                                size: collection_create.size,
                                distance: collection_create.distance as i32,
                                on_disk: Some(true),
                                ..Default::default()
                            },
                        )]
                        .into(),
                    })),
                });
            }
            None => {
                config = Some(VectorsConfig {
                    config: Some(Config::Params(VectorParams {
                        size: collection_create.size,
                        distance: collection_create.distance as i32,
                        on_disk: Some(true),
                        ..Default::default()
                    })),
                });
            }
        }
        match client
            .create_collection(&CreateCollection {
                collection_name: collection_create.collection_name,
                vectors_config: config,
                ..Default::default()
            })
            .await
        {
            Ok(results) => match results.result {
                true => Ok(VectorDatabaseStatus::Ok),
                false => Ok(VectorDatabaseStatus::NotFound),
            },
            Err(e) => Err(VectorDatabaseError::AnyhowError(e)),
        }
    }

    async fn delete_collection(
        &self,
        client: &Self,
        search_request: SearchRequest,
    ) -> Result<VectorDatabaseStatus, VectorDatabaseError> {
        let collection_id = search_request.collection.clone();
        match self.check_collection_exists(&client, search_request).await {
            Ok(collection_result) => match collection_result.status {
                VectorDatabaseStatus::Ok => {
                    if let Ok(response) = client.delete_collection(collection_id).await {
                        match response.result {
                            true => Ok(VectorDatabaseStatus::Ok),
                            _ => Ok(VectorDatabaseStatus::Failure),
                        }
                    } else {
                        Ok(VectorDatabaseStatus::Failure)
                    }
                }
                _ => Err(VectorDatabaseError::Other(
                    "An error occurred while checking if \
                    collection exists"
                        .to_string(),
                )),
            },
            Err(e) => Err(VectorDatabaseError::Other(e.to_string())),
        }
    }

    async fn insert_point(
        &self,
        client: &Self,
        search_request: SearchRequest,
        point: Point,
    ) -> Result<VectorDatabaseStatus, VectorDatabaseError> {
        let collection_id = search_request.clone().collection;
        let mut backoff = ExponentialBackoff {
            current_interval: Duration::from_millis(50),
            initial_interval: Duration::from_millis(50),
            max_interval: Duration::from_secs(3),
            max_elapsed_time: Some(Duration::from_secs(60)),
            multiplier: 1.5,
            randomization_factor: 0.5,
            ..ExponentialBackoff::default()
        };
        if let Some(point_struct) =
            construct_point_struct(&point.vector, point.payload.unwrap(), None, None).await
        {
            let _ = async {
                loop {
                    match client
                        .upsert_points_batch_blocking(
                            collection_id.clone(),
                            None,
                            vec![point_struct.clone()], // Ensure point is Clone for retries
                            None,
                            100,
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
            }
            .await;
        }
        Ok(VectorDatabaseStatus::from(VectorDatabaseStatus::from(true)))
    }

    async fn bulk_insert_points(
        &self,
        client: &Self,
        search_request: SearchRequest,
        points: Vec<Point>,
    ) -> Result<VectorDatabaseStatus, VectorDatabaseError> {
        let collection_id = search_request.collection;
        let mut backoff = ExponentialBackoff {
            current_interval: Duration::from_millis(50),
            initial_interval: Duration::from_millis(50),
            max_interval: Duration::from_secs(3),
            max_elapsed_time: Some(Duration::from_secs(60)),
            multiplier: 1.5,
            randomization_factor: 0.5,
            ..ExponentialBackoff::default()
        };
        let mut list_of_points: Vec<PointStruct> = vec![];
        for point in points {
            if let Some(point_struct) =
                construct_point_struct(&point.vector, point.payload.unwrap(), None, None).await
            {
                list_of_points.push(point_struct)
            }
        }
        let retry_result = async {
            loop {
                match client
                    .upsert_points_batch_blocking(
                        collection_id.clone(),
                        None,
                        list_of_points.clone(), // Ensure point is Clone for retries
                        None,
                        100,
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
        }
        .await;

        Ok(VectorDatabaseStatus::from(VectorDatabaseStatus::from(
            retry_result?,
        )))
    }

    async fn get_collection_info(
        &self,
        client: &Self,
        search_request: SearchRequest,
    ) -> Result<Option<CollectionMetadata>, VectorDatabaseError> {
        let collection_id = search_request.collection;
        let collection_id_clone = collection_id.clone();
        match client.collection_info(collection_id).await {
            Ok(info_results) => {
                if let Some(info) = info_results.result {
                    let collection_info = CollectionMetadata {
                        status: VectorDatabaseStatus::from(info.clone()),
                        indexed_vectors_count: info.indexed_vectors_count.clone(),
                        segments_count: Some(info.segments_count.clone()),
                        points_count: info.points_count,
                    };
                    Ok(Some(collection_info))
                } else {
                    Ok(None)
                }
            }
            Err(e) => Err(VectorDatabaseError::AnyhowError(anyhow!(
                "An error occurred while getting info for \
                collection : {}. Error: {}",
                collection_id_clone,
                e
            ))),
        }
    }
    async fn get_storage_size(
        &self,
        client: &Self,
        search_request: SearchRequest,
        vector_length: usize,
    ) -> Result<Option<StorageSize>, VectorDatabaseError> {
        let collection_id = search_request.clone().collection;
        if let Ok(collection_info) = &self.get_collection_info(&client, search_request).await {
            if let Some(info) = collection_info {
                if let Some(number_of_vectors) = info.points_count {
                    let size = (number_of_vectors as usize * vector_length * 4) as f64 * 1.15;
                    let collection_storage_size = StorageSize {
                        status: VectorDatabaseStatus::Ok,
                        points_count: Some(number_of_vectors),
                        size: Some(size.ceil()),
                        collection_name: collection_id,
                    };
                    Ok(Some(collection_storage_size))
                } else {
                    Ok(None)
                }
            } else {
                Ok(None)
            }
        } else {
            Ok(None)
        }
    }

    async fn scroll_points(
        &self,
        client: &Self,
        search_request: SearchRequest,
    ) -> Result<Vec<ScrollResults>, VectorDatabaseError> {
        let collection_id = search_request.collection;
        let mut response: Vec<ScrollResults> = vec![];
        if let Some(search_response_params) = search_request.search_response_params {
            let mut qdrant_filters = Filter::default();
            if let Some(filters) = search_request.filters {
                (
                    qdrant_filters.must,
                    qdrant_filters.must_not,
                    qdrant_filters.should,
                ) = convert_hashmap_to_qdrant_filters(&Some(filters));
            }
            let mut scroll_points = ScrollPoints {
                collection_name: collection_id,
                filter: Some(qdrant_filters),
                with_vectors: Some(WithVectorsSelector {
                    selector_options: Some(SelectorOptions::Enable(true)),
                }),
                ..Default::default()
            };

            // Depending on whether the client has requested to return all point or not
            if let Some(get_all_pages) = search_response_params.get_all_pages {
                // Depending on whether the client provides a limit we update the scroll point limit
                if get_all_pages {
                    loop {
                        let (result, offset) = get_next_page(client, &scroll_points).await?;
                        let res = get_scroll_results(result)?;
                        response.extend(res);
                        if offset == "Done" {
                            break;
                        }
                        scroll_points.offset = Some(PointId {
                            point_id_options: Some(PointIdOptions::Uuid(offset)),
                        });
                    }
                } else {
                    let result = client.scroll(&scroll_points).await?;
                    response.extend(get_scroll_results(result)?);
                }
            }
        }
        Ok(response)
    }
    async fn similarity_search(
        &self,
        client: Self,
        search_request: SearchRequest,
    ) -> Result<Vec<SearchResult>, VectorDatabaseError> {
        let collection_id = search_request.collection;
        let mut qdrant_filters = Filter::default();
        if let Some(filters) = search_request.filters {
            (
                qdrant_filters.must,
                qdrant_filters.must_not,
                qdrant_filters.should,
            ) = convert_hashmap_to_qdrant_filters(&Some(filters));
        }
        let mut response_data: Vec<SearchResult> = vec![];
        let search_result = client
            .search_points(&SearchPoints {
                collection_name: collection_id.clone(),
                vector: search_request.vector.unwrap_or_default().to_owned(),
                filter: Some(qdrant_filters),
                limit: search_request
                    .search_response_params
                    .unwrap()
                    .limit
                    .unwrap_or(5) as u64,
                with_payload: Some(true.into()),
                ..Default::default()
            })
            .await?;
        for result in &search_result.result {
            response_data.push(SearchResult {
                vector: None,
                score: Some(result.score),
                payload: Some(
                    result
                        .payload
                        .to_owned()
                        .iter()
                        .map(|(k, v)| (k.clone(), v.to_string()))
                        .collect(),
                ),
            });
        }
        Ok(response_data)
    }
}
