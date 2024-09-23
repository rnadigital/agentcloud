use crate::adaptors::pinecone::helpers::{get_index_model, get_indexes, upsert};
use crate::vector_databases::error::VectorDatabaseError;
use crate::vector_databases::models::{
    CollectionCreate, CollectionMetadata, CollectionsResult, Distance, Point, Region,
    ScrollResults, SearchRequest, SearchResult, SearchType, StorageSize, VectorDatabaseStatus,
};
use crate::vector_databases::utils::calculate_vector_storage_size;
use crate::vector_databases::vector_database::VectorDatabase;
use async_trait::async_trait;
use pinecone_sdk::models::{Cloud as PineconeCloud, Metadata};
use pinecone_sdk::models::{DeletionProtection, Metric, Namespace, Vector, WaitPolicy};
use pinecone_sdk::pinecone::PineconeClient;
use std::sync::Arc;

#[async_trait]
impl VectorDatabase for PineconeClient {
    async fn get_list_of_collections(&self) -> Result<Vec<String>, VectorDatabaseError> {
        let mut list_of_namespaces: Vec<String> = vec![];
        let list_of_indexes = get_indexes(self).await;
        for index in list_of_indexes {
            let index_model = &self.describe_index(index.as_str()).await.unwrap();
            let mut index = self.index(index_model.host.as_str()).await.unwrap();
            let index_stats = index.describe_index_stats(None).await.unwrap();
            list_of_namespaces.extend(
                index_stats
                    .namespaces
                    .keys()
                    .cloned()
                    .collect::<Vec<String>>(),
            )
        }
        Ok(list_of_namespaces)
    }

    async fn check_collection_exists(
        &self,
        search_request: SearchRequest,
    ) -> Result<CollectionsResult, VectorDatabaseError> {
        let mut collection_results = CollectionsResult {
            status: VectorDatabaseStatus::NotFound,
            collection_name: search_request.collection.clone(),
            collection_metadata: None,
        };
        let index_name = Region::to_str(search_request.region.unwrap_or_default());
        match get_index_model(&self, index_name.to_string()).await {
            Ok(index_model) => {
                collection_results.status = VectorDatabaseStatus::Ok;
                collection_results.collection_metadata = Some(CollectionMetadata {
                    status: VectorDatabaseStatus::Ok,
                    collection_vector_count: None,
                    metric: Some(Distance::from(index_model.metric)),
                    dimensions: Some(index_model.dimension as u64),
                });
                Ok(collection_results)
            }
            Err(e) => Err(e),
        }
    }

    async fn create_collection(
        &self,
        collection_create: CollectionCreate,
    ) -> Result<VectorDatabaseStatus, VectorDatabaseError> {
        let index_name = Region::to_str(collection_create.region.unwrap_or_default());
        match get_index_model(&self, index_name.to_string()).await {
            Ok(_) => Ok(VectorDatabaseStatus::Ok),
            Err(e) => match e {
                VectorDatabaseError::NotFound(_) => {
                    match self
                        .create_serverless_index(
                            Region::to_str(collection_create.region.unwrap_or_default()),
                            collection_create.dimensions as i32,
                            Metric::from(collection_create.distance),
                            PineconeCloud::from(collection_create.cloud.unwrap_or_default()),
                            Region::to_str(collection_create.region.unwrap_or_default()),
                            DeletionProtection::Disabled,
                            WaitPolicy::NoWait,
                        )
                        .await
                    {
                        Ok(_) => Ok(VectorDatabaseStatus::Ok),
                        Err(e) => Err(VectorDatabaseError::PineconeError(Arc::new(e))),
                    }
                }
                _ => Err(e),
            },
        }
    }

    async fn delete_collection(
        &self,
        search_request: SearchRequest,
    ) -> Result<VectorDatabaseStatus, VectorDatabaseError> {
        let region = search_request.clone().region.unwrap_or(Region::US);
        if let Ok(index_model) = get_index_model(&self, Region::to_str(region).to_string()).await {
            // Need to figure out the the default index name here
            let mut index = self.index(index_model.host.as_str()).await.unwrap();
            let pinecone_namespace = Namespace::from(search_request.collection.as_str());
            return match index.delete_all(&pinecone_namespace).await {
                Ok(_) => Ok(VectorDatabaseStatus::Ok),
                Err(e) => Err(VectorDatabaseError::PineconeError(Arc::new(e))),
            };
        };
        Ok(VectorDatabaseStatus::NotFound)
    }

    async fn insert_point(
        &self,
        search_request: SearchRequest,
        point: Point,
    ) -> Result<VectorDatabaseStatus, VectorDatabaseError> {
        let region = search_request.clone().region.unwrap_or(Region::US);
        let vector = Vector::from(point);
        let namespace = search_request.clone().collection;
        match get_index_model(&self, Region::to_str(region).to_string()).await {
            Ok(index_model) => {
                let index = self.index(index_model.host.as_str()).await.unwrap();
                match search_request.search_type {
                    SearchType::ChunkedRow => match &self.delete_point(search_request).await {
                        Ok(_) => match upsert(index, &[vector], &namespace.into()).await {
                            Ok(_) => Ok(VectorDatabaseStatus::Ok),
                            Err(e) => Err(e),
                        },
                        Err(e) => Err(e.to_owned()),
                    },
                    _ => match upsert(index, &[vector], &namespace.into()).await {
                        Ok(_) => Ok(VectorDatabaseStatus::Ok),
                        Err(e) => Err(e),
                    },
                }
            }
            Err(e) => Err(e),
        }
    }

    async fn delete_point(
        &self,
        search_request: SearchRequest,
    ) -> Result<VectorDatabaseStatus, VectorDatabaseError> {
        let region = search_request.region.unwrap_or(Region::US);
        let pinecone_filters = search_request.filters.map_or(None, |filter_conditions| {
            Some(Metadata::from(filter_conditions))
        });
        let namespace = search_request.collection;
        match get_index_model(&self, Region::to_str(region).to_string()).await {
            Ok(index_model) => match self.index(index_model.host.as_str()).await {
                Ok(mut index) => {
                    match index
                        .delete_by_filter(pinecone_filters.unwrap(), &namespace.into())
                        .await
                    {
                        Ok(_) => Ok(VectorDatabaseStatus::Ok),
                        Err(e) => Err(VectorDatabaseError::PineconeError(Arc::new(e))),
                    }
                }
                Err(e) => Err(VectorDatabaseError::PineconeError(Arc::new(e))),
            },
            Err(e) => Err(e),
        }
    }

    async fn bulk_insert_points(
        &self,
        search_request: SearchRequest,
        points: Vec<Point>,
    ) -> Result<VectorDatabaseStatus, VectorDatabaseError> {
        let region = search_request.clone().region.unwrap_or(Region::US);
        let vectors: Vec<Vector> = points.iter().map(|p| Vector::from(p.to_owned())).collect();
        let namespace = search_request.collection;

        if let Ok(index_model) = get_index_model(&self, Region::to_str(region).to_string()).await {
            // Need to figure out the the default index name here
            let mut index = self.index(index_model.host.as_str()).await.unwrap();
            match search_request.search_type {
                SearchType::ChunkedRow => {
                    // Collect indices into a Vec<&str>
                    let ids: Vec<&str> = points.iter().filter_map(|p| p.index.as_deref()).collect();
                    println!("Ids to delete {:?}", ids);
                    println!("namespace to delete from {:?}", namespace);
                    // Use the collected ids directly in the delete_by_id method
                    let _ = index
                        .delete_by_id(&ids, &namespace.clone().into())
                        .await
                        .unwrap();
                }
                _ => {}
            }
            return match upsert(index, &vectors, &namespace.into()).await {
                Ok(_) => Ok(VectorDatabaseStatus::Ok),
                Err(e) => Err(e),
            };
        };
        Err(VectorDatabaseError::NotFound(
            format!("Index {namespace} was not found").to_string(),
        ))
    }

    async fn get_collection_info(
        &self,
        search_request: SearchRequest,
    ) -> Result<Option<CollectionMetadata>, VectorDatabaseError> {
        let region = search_request.clone().region.unwrap_or(Region::US);
        if let Ok(index_model) = get_index_model(&self, Region::to_str(region).to_string()).await {
            let mut index = self.index(index_model.host.as_str()).await.unwrap();
            let index_stats = index.describe_index_stats(None).await.unwrap();
            let vector_count: Option<u64> = index_stats.namespaces.iter().find_map(|(k, v)| {
                (*k == search_request.collection).then(|| v.vector_count as u64)
            });
            return Ok(Some(CollectionMetadata {
                status: VectorDatabaseStatus::Ok,
                collection_vector_count: vector_count,
                metric: Some(Distance::from(index_model.metric)),
                dimensions: Some(index_model.dimension as u64),
            }));
        };
        Ok(None)
    }
    async fn get_storage_size(
        &self,
        search_request: SearchRequest,
        vector_length: usize,
    ) -> Result<Option<StorageSize>, VectorDatabaseError> {
        if let Ok(Some(collection_info)) = self.get_collection_info(search_request.clone()).await {
            if let Some(vector_count) = collection_info.collection_vector_count {
                let vector_storage_size =
                    calculate_vector_storage_size(vector_count as usize, vector_length);
                return Ok(Some(StorageSize {
                    status: VectorDatabaseStatus::Ok,
                    collection_name: search_request.collection,
                    size: Some(vector_storage_size),
                    points_count: Some(vector_count),
                }));
            }
        }
        Ok(None)
    }

    async fn scroll_points(
        &self,
        _search_request: SearchRequest,
    ) -> Result<Vec<ScrollResults>, VectorDatabaseError> {
        todo!()
    }

    async fn similarity_search(
        &self,
        search_request: SearchRequest,
    ) -> Result<Vec<SearchResult>, VectorDatabaseError> {
        let region = search_request.clone().region.unwrap_or(Region::US);
        if let Ok(index_model) = get_index_model(&self, Region::to_str(region).to_string()).await {
            let mut index = self.index(index_model.host.as_str()).await.unwrap();
            let namespace = Namespace::from(search_request.collection.as_str());
            let _return_params = search_request.search_response_params.unwrap();
            return if let Some(vector) = search_request.vector {
                if let Ok(results) = index
                    .query_by_value(
                        vector,
                        None,
                        search_request.top_k.unwrap(),
                        &namespace,
                        None,
                        Some(false),
                        Some(true),
                    )
                    .await
                {
                    let matched_vectors: Vec<SearchResult> = results
                        .matches
                        .iter()
                        .map(|res| {
                            let point = Point::from(res.clone().metadata.unwrap());
                            SearchResult {
                                id: res.clone().id,
                                score: Some(res.score),
                                payload: point.payload,
                                vector: Some(res.clone().values),
                            }
                        })
                        .collect();
                    Ok(matched_vectors)
                } else {
                    Err(VectorDatabaseError::Other(
                        "Something bad happened!".to_string(),
                    ))
                }
            } else {
                Err(VectorDatabaseError::Other(
                    "Something bad happened!".to_string(),
                ))
            };
        }
        Ok(vec![])
    }
}
