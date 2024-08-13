use std::sync::Arc;

use pinecone_sdk::pinecone::PineconeClient;
use qdrant_client::client::QdrantClient;
use tokio::sync::RwLock;
use tonic::async_trait;

use crate::vector_dbs::models::*;

pub enum VectorDatabases {
    Qdrant(Arc<RwLock<QdrantClient>>),
    Pinecone(Arc<RwLock<PineconeClient>>)
}

impl Clone for VectorDatabases {
    fn clone(&self) -> Self {
        match self {
            VectorDatabases::Qdrant(client) => VectorDatabases::Qdrant(Arc::clone(client)),
            VectorDatabases::Pinecone(client) => VectorDatabases::Pinecone(Arc::clone(client))
        }
    }
}

#[async_trait]
pub trait VectorDatabase {
    type Database;
    async fn connect(&self, uri: &str) -> Self;
    async fn get_list_of_collections(
        &self,
        client: &Self,
    ) -> Result<Vec<String>, VectorDatabaseError>;
    async fn check_collection_exists(
        &self,
        client: &Self,
        collection_id: String,
    ) -> Result<CollectionsResult, VectorDatabaseError>;
    async fn create_collection(
        &self,
        client: &Self,
        collection_create: CollectionCreate,
    ) -> Result<VectorDatabaseStatus, VectorDatabaseError>;
    async fn delete_collection(
        &self,
        client: &Self,
        collection_id: String,
    ) -> Result<VectorDatabaseStatus, VectorDatabaseError>;
    async fn insert_points(
        &self,
        client: &Self,
        collection_id: String,
        points: Vec<Point>,
    ) -> Result<VectorDatabaseStatus, VectorDatabaseError>;
    async fn update_points(
        &self,
        client: &Self,
        search_requests: SearchRequest,
        point: Vec<Point>,
    ) -> Result<VectorDatabaseStatus, VectorDatabaseError>;
    async fn delete_points(
        &self,
        client: &Self,
        search_request: SearchRequest,
    ) -> Result<CollectionsResult, VectorDatabaseError>;
    async fn get_points(
        &self,
        client: &Self,
        search_request: SearchRequest,
    ) -> Result<Vec<Point>, VectorDatabaseError>;
    async fn get_storage_size(
        &self,
        client: &Self,
        search_request: SearchRequest,
    ) -> Result<StorageSize, VectorDatabaseError>;
    async fn scroll_points(
        &self,
        client: &Self,
        search_request: SearchRequest,
    ) -> Result<ScrollResults, VectorDatabaseError>;
}