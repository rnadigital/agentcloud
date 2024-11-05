use crate::adaptors::mongo::models::VectorDatabaseType;
use crate::adaptors::{pinecone, qdrant};
use crate::init::env_variables::GLOBAL_DATA;
use crate::vector_databases::error::VectorDatabaseError;
use crate::vector_databases::models::*;
use async_trait::async_trait;
use pinecone_sdk::pinecone::PineconeClient;
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

    async fn display_config(&self);
}
// Factory method to build Vector database client based on
#[derive(Debug)]
pub struct VectorDbClient {
    pub vector_db_type: VectorDatabaseType,
    pub url: Option<String>,
    pub api_key: Option<String>,
}
pub async fn default_vector_db_client() -> Arc<RwLock<dyn VectorDatabase>> {
    let global_data = GLOBAL_DATA.read().await;
    let vector_db = global_data.vector_database.clone();
    let vector_db_type = VectorDatabaseType::from(vector_db);
    let vector_db_url = global_data.vector_database_url.clone();
    let vector_db_api_key = global_data.vector_database_api_key.clone();

    let vector_db_config = VectorDbClient {
        vector_db_type,
        url: Some(vector_db_url),
        api_key: Some(vector_db_api_key),
    };

    vector_db_config.build_vector_db_client().await
}

impl VectorDbClient {
    pub async fn build_vector_db_client(&self) -> Arc<RwLock<dyn VectorDatabase>> {
        println!("The incoming credentials are: {:?}", self);
        println!("Building NEW {} vector client", self.vector_db_type);
        let vector_database_client: Arc<RwLock<dyn VectorDatabase>> = match self
            .vector_db_type
            .to_string()
            .as_str()
        {
            "qdrant" => {
                println!("Using Qdrant Vector Database");
                Arc::new(RwLock::new(
                    qdrant::client::build_qdrant_client(self.url.clone(), self.api_key.clone())
                        .await
                        .unwrap(),
                ))
            }
            "pinecone" => {
                println!("Using Pinecone Vector Database");
                Arc::new(RwLock::new(
                    pinecone::client::build_pinecone_client(self.url.clone(), self.api_key.clone())
                        .await
                        .unwrap(),
                ))
            }
            _ => panic!(
                "No valid vector database was chosen. Expected one of `qdrant` or `pinecone`.\
             Got `{}`",
                self.vector_db_type
            ),
        };
        vector_database_client
    }
}
