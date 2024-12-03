use crate::adaptors::pinecone::helpers::{get_index_model, get_indexes, upsert};
use crate::vector_databases::error::VectorDatabaseError;
use crate::vector_databases::models::{
    CollectionCreate, CollectionMetadata, CollectionsResult, Distance, Point, Region,
    ScrollResults, SearchRequest, SearchResult, SearchType, StorageSize, VectorDatabaseStatus,
};
use crate::vector_databases::utils::calculate_vector_storage_size;
use crate::vector_databases::vector_database::VectorDatabase;
use async_trait::async_trait;
use pinecone_sdk::models::{Cloud, DeletionProtection, Metadata, Metric, WaitPolicy};
use pinecone_sdk::models::{Namespace, Vector};
use pinecone_sdk::pinecone::PineconeClient;
use prost_types::value::Kind;
use prost_types::Value;
use std::collections::BTreeMap;
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
        let index_name = search_request.clone().collection;
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
        println!("Creating collection: {:?}", collection_create);

        let index_name = collection_create
            .index_name
            .clone()
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| {
                collection_create
                    .region
                    .clone()
                    .unwrap_or_default()
                    .to_string()
            });
        println!("Index name: {}", index_name);

        match get_index_model(&self, index_name.clone()).await {
            Ok(_) => Ok(VectorDatabaseStatus::Ok),
            Err(e) => match e {
                VectorDatabaseError::NotFound(_) => {
                    println!("creating db");
                    match self
                        .create_serverless_index(
                            index_name.as_str(),
                            collection_create.dimensions as i32,
                            Metric::from(collection_create.distance),
                            collection_create
                                .cloud
                                .as_ref()
                                .map(|cloud| match cloud.as_str() {
                                    "gcp" => Cloud::Gcp,
                                    "aws" => Cloud::Aws,
                                    "azure" => Cloud::Azure,
                                    _ => Cloud::default(),
                                })
                                .unwrap_or(Cloud::default()),
                            collection_create.region.as_deref().unwrap_or_default(),
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
        let region = search_request.clone().region.unwrap_or(Region::US_EAST_1);
        let index_name = search_request
            .byo_vector_db
            .map_or(Region::to_str(region), |_k| {
                search_request.collection.as_str()
            })
            .to_string();
        if let Ok(index_model) = get_index_model(&self, index_name).await {
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
        let region = search_request.clone().region.unwrap_or(Region::US_EAST_1);
        let vector = Vector::from(point);
        let namespace = search_request
            .clone()
            .namespace
            .map_or(search_request.clone().collection, |n| n);
        let index_name = search_request
            .byo_vector_db
            .filter(|k| *k == true)
            .map_or(Region::to_str(region), |_| {
                search_request.collection.as_str()
            })
            .to_string();
        match get_index_model(&self, index_name).await {
            Ok(index_model) => {
                println!("Sending to Pinecone index: {:?}", index_model);
                let index = self.index(index_model.host.as_str()).await.unwrap();
                match search_request.search_type {
                    SearchType::ChunkedRow => {
                        match &self.delete_point(search_request.clone()).await {
                            Ok(_) => match upsert(index, &[vector], &namespace.into()).await {
                                Ok(_) => {
                                    println!("Upsert Successful");
                                    Ok(VectorDatabaseStatus::Ok)
                                }
                                Err(e) => Err(e),
                            },
                            Err(e) => Err(e.to_owned()),
                        }
                    }
                    _ => match upsert(index, &[vector], &namespace.into()).await {
                        Ok(_) => {
                            println!("Upsert Successful");
                            Ok(VectorDatabaseStatus::Ok)
                        }
                        Err(e) => {
                            println!(
                                "An error occurred while attempting to upsert. Error: {}",
                                e.clone()
                            );
                            Err(e)
                        }
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
        let region = search_request.region.unwrap_or(Region::US_EAST_1);
        let pinecone_filters = search_request
            .clone()
            .filters
            .map_or(None, |filter_conditions| {
                Some(Metadata::from(filter_conditions))
            });
        let namespace = search_request
            .clone()
            .namespace
            .map_or(search_request.clone().collection, |n| n);
        let index_name = search_request
            .byo_vector_db
            .filter(|k| *k == true)
            .map_or(Region::to_str(region), |_| {
                search_request.collection.as_str()
            })
            .to_string();
        match get_index_model(&self, index_name).await {
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
        let region = search_request.clone().region.unwrap_or(Region::US_EAST_1);
        let vectors: Vec<Vector> = points.iter().map(|p| Vector::from(p.to_owned())).collect();
        let namespace = search_request
            .clone()
            .namespace
            .map_or(search_request.clone().collection, |n| n);
        let index_name = search_request
            .byo_vector_db
            .filter(|k| *k == true)
            .map_or(Region::to_str(region), |_| {
                search_request.collection.as_str()
            })
            .to_string();

        if let Ok(index_model) = get_index_model(&self, index_name).await {
            // Need to figure out the the default index name here
            let mut index = self.index(index_model.host.as_str()).await.unwrap();
            match search_request.search_type {
                SearchType::ChunkedRow => {
                    // Collect indices into a Vec<&str>
                    let indices: Result<Vec<String>, _> = points
                        .iter()
                        .map(|p| {
                            p.index
                                .as_ref()
                                .ok_or("Index is None")?
                                .as_str()
                                .ok_or("Index is not a string")
                                .map(|s| s.to_string())
                        })
                        .collect();

                    println!("Ids to delete {:?}", indices);
                    //println!("namespace to delete from {:?}", &namespace.clone());
                    for idx in indices.unwrap() {
                        // Use the collected ids directly in the delete_by_id method
                        let mut fields = BTreeMap::new();
                        fields.insert(
                            "index".to_string(),
                            Value {
                                kind: Some(Kind::StringValue(idx.to_string())),
                            },
                        );

                        let query_response = index
                            .query_by_value(
                                vec![],
                                None,
                                2 ^ 32,
                                &namespace.clone().into(),
                                None,
                                None,
                                None,
                            )
                            .await;
                        if let Ok(points) = query_response {
                            let ids: Vec<&str> =
                                points.matches.iter().map(|j| j.id.as_str()).collect();
                            match index.delete_by_id(&ids, &namespace.clone().into()).await {
                                Ok(_) => println!("Point deleted successfully"),
                                Err(e) => println!(
                                    "An error occurred while attempting to delete \
                                point. Error: {}",
                                    e
                                ),
                            }
                        };
                    }
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
        let region = search_request.clone().region.unwrap_or(Region::US_EAST_1);
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
        let region = search_request.clone().region.unwrap_or(Region::US_EAST_1);
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

    async fn display_config(&self) {
        let list_of_index = &self.list_indexes().await.unwrap();
        println!(
            "Pinecone Host: {}",
            list_of_index.clone().indexes.unwrap()[0].host
        );
    }
}
