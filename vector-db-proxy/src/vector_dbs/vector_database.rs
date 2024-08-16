use async_trait::async_trait;
use pinecone_sdk::pinecone::{PineconeClient, PineconeClientConfig};
use qdrant_client::client::QdrantClient;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::vector_dbs::models::*;
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
    pub async fn get_client(&self) -> Option<VectorDatabaseClients> {
        match self {
            VectorDatabases::Qdrant(client) => {
                Some(VectorDatabaseClients::Qdrant(client.to_owned()))
            }
            VectorDatabases::Pinecone(client) => {
                Some(VectorDatabaseClients::Pinecone(client.to_owned()))
            }
            VectorDatabases::Unknown => None,
        }
    }
}
pub enum VectorDatabaseClients {
    Qdrant(Arc<RwLock<QdrantClient>>),
    Pinecone(Arc<RwLock<PineconeClient>>),
}

impl From<String> for VectorDatabases {
    fn from(value: String) -> Self {
        match value.as_str() {
            "qdrant" => {
                let qdrant_host = dotenv::var("QDRANT_HOST").unwrap_or("".to_string());
                let qdrant_uri = format!("{}:6334", qdrant_host);
                let client = QdrantClient::from_url(qdrant_uri.as_str());
                VectorDatabases::Qdrant(Arc::new(RwLock::new(client.build().unwrap())))
            }
            "pinecone" => {
                let config = PineconeClientConfig {
                    api_key: Some("INSERT_API_KEY".to_string()),
                    control_plane_host: Some("INSERT_CONTROLLER_HOST".to_string()),
                    ..Default::default()
                };
                let pinecone: PineconeClient = config.client().expect("Failed to create Pinecone");
                VectorDatabases::Pinecone(Arc::new(RwLock::new(pinecone)))
            }
            _ => VectorDatabases::Unknown,
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
