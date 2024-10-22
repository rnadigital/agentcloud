use crate::adaptors::mongo::models::VectorDb;
use crate::vector_databases::error::VectorDatabaseError;
use crate::vector_databases::models::*;
use async_trait::async_trait;
use pinecone_sdk::pinecone::{PineconeClient, PineconeClientConfig};
use qdrant_client::client::QdrantClient;
use std::sync::Arc;
use tokio::sync::RwLock;
pub enum VectorDatabases {
    Qdrant(Arc<RwLock<QdrantClient>>),
    Pinecone(Arc<RwLock<PineconeClient>>),
    Unknown,
}

impl Clone for VectorDatabases {
    fn clone(&self) -> Self {
        match self {
            VectorDatabases::Qdrant(client) => VectorDatabases::Qdrant(Arc::clone(client)),
            VectorDatabases::Pinecone(client) => VectorDatabases::Pinecone(Arc::clone(client)),
            VectorDatabases::Unknown => VectorDatabases::Unknown,
        }
    }
}

impl VectorDatabases {
    async fn update_credentials(&self, vector_db_config: VectorDb) -> Self {
        match self {
            VectorDatabases::Pinecone(_) => {
                let client_config = PineconeClientConfig {
                    api_key: Some(vector_db_config.apiKey),
                    control_plane_host: vector_db_config.url,
                    ..Default::default()
                };
                VectorDatabases::Pinecone(Arc::new(RwLock::new(
                    client_config
                        .client()
                        .expect("Failed to create new pinecone client"),
                )))
            }
            VectorDatabases::Qdrant(client) => {
                // Acquire a read lock to clone the inner client
                {
                    let mut client_guard = client.write().await;
                    client_guard.cfg.api_key = Some(vector_db_config.apiKey.clone());
                }
                VectorDatabases::Qdrant(Arc::clone(client))
            }
            VectorDatabases::Unknown => VectorDatabases::Unknown,
        }
    }
}

#[async_trait]
pub trait VectorDatabase: Send + Sync {
    //type Database;
    async fn get_list_of_collections(&self) -> Result<Vec<String>, VectorDatabaseError>;
    async fn check_collection_exists(
        &self,
        search_request: SearchRequest,
    ) -> Result<CollectionsResult, VectorDatabaseError>;
    async fn create_collection(
        &self,
        collection_create: CollectionCreate,
    ) -> Result<VectorDatabaseStatus, VectorDatabaseError>;
    async fn delete_collection(
        &self,
        search_request: SearchRequest,
    ) -> Result<VectorDatabaseStatus, VectorDatabaseError>;
    async fn insert_point(
        &self,
        search_request: SearchRequest,
        point: Point,
    ) -> Result<VectorDatabaseStatus, VectorDatabaseError>;
    async fn delete_point(
        &self,
        search_request: SearchRequest,
    ) -> Result<VectorDatabaseStatus, VectorDatabaseError>;
    async fn bulk_insert_points(
        &self,
        search_request: SearchRequest,
        points: Vec<Point>,
    ) -> Result<VectorDatabaseStatus, VectorDatabaseError>;
    async fn get_collection_info(
        &self,
        search_request: SearchRequest,
    ) -> Result<Option<CollectionMetadata>, VectorDatabaseError>;
    async fn get_storage_size(
        &self,
        search_request: SearchRequest,
        vector_length: usize,
    ) -> Result<Option<StorageSize>, VectorDatabaseError>;
    async fn scroll_points(
        &self,
        search_request: SearchRequest,
    ) -> Result<Vec<ScrollResults>, VectorDatabaseError>;

    async fn similarity_search(
        &self,
        search_request: SearchRequest,
    ) -> Result<Vec<SearchResult>, VectorDatabaseError>;
}
