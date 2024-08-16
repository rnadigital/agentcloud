use crate::vector_dbs::models::{
    CollectionCreate, CollectionMetadata, CollectionsResult, Point, ScrollResults, SearchRequest,
    SearchResult, StorageSize, VectorDatabaseError, VectorDatabaseStatus,
};
use crate::vector_dbs::vector_database::VectorDatabase;
use async_trait::async_trait;
use pinecone_sdk::pinecone::PineconeClient;
#[async_trait]
impl VectorDatabase for PineconeClient {
    async fn get_list_of_collections(&self) -> Result<Vec<String>, VectorDatabaseError> {
        todo!()
    }

    async fn check_collection_exists(
        &self,
        search_request: SearchRequest,
    ) -> Result<CollectionsResult, VectorDatabaseError> {
        todo!()
    }

    async fn create_collection(
        &self,
        collection_create: CollectionCreate,
    ) -> Result<VectorDatabaseStatus, VectorDatabaseError> {
        todo!()
    }

    async fn delete_collection(
        &self,
        search_request: SearchRequest,
    ) -> Result<VectorDatabaseStatus, VectorDatabaseError> {
        todo!()
    }

    async fn insert_point(
        &self,
        search_request: SearchRequest,
        point: Point,
    ) -> Result<VectorDatabaseStatus, VectorDatabaseError> {
        todo!()
    }

    async fn bulk_insert_points(
        &self,
        search_request: SearchRequest,
        points: Vec<Point>,
    ) -> Result<VectorDatabaseStatus, VectorDatabaseError> {
        todo!()
    }

    async fn get_collection_info(
        &self,
        search_request: SearchRequest,
    ) -> Result<Option<CollectionMetadata>, VectorDatabaseError> {
        todo!()
    }

    async fn get_storage_size(
        &self,
        search_request: SearchRequest,
        vector_length: usize,
    ) -> Result<Option<StorageSize>, VectorDatabaseError> {
        todo!()
    }

    async fn scroll_points(
        &self,
        search_request: SearchRequest,
    ) -> Result<Vec<ScrollResults>, VectorDatabaseError> {
        todo!()
    }

    async fn similarity_search(
        &self,
        search_request: SearchRequest,
    ) -> Result<Vec<SearchResult>, VectorDatabaseError> {
        todo!()
    }
}
