use std::sync::Arc;

use anyhow::Result;
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
    async fn get_list_of_collections(&self) -> Result<Vec<CollectionsResult>>;
    async fn check_collection_exists(&self, collection_id: String) -> Result<CollectionsResult>;
    async fn create_collection(&self, collection_id: String) -> Result<VectorDatabaseStatus>;
    async fn delete_collection(&self, collection_id: String) -> Result<VectorDatabaseStatus>;
    async fn insert_points(&self, point: Vec<Point>) -> Result<VectorDatabaseStatus>;
    async fn update_points(&self, search_requests: SearchRequest, point: Vec<Point>) ->
    Result<VectorDatabaseStatus>;
    async fn delete_points(&self, search_request: SearchRequest) -> Result<CollectionsResult>;
    async fn get_points(&self, search_request: SearchRequest) -> Result<Vec<Point>>;
    async fn scroll_points(&self, search_request: SearchRequest) -> Result<ScrollResults>;
}