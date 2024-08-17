use crate::adaptors::pinecone::helpers::get_indexes;
use crate::vector_databases::error::VectorDatabaseError;
use crate::vector_databases::models::{
    CollectionCreate, CollectionMetadata, CollectionsResult, Point, ScrollResults, SearchRequest,
    SearchResult, StorageSize, VectorDatabaseStatus,
};
use crate::vector_databases::vector_database::VectorDatabase;
use async_trait::async_trait;
use pinecone_sdk::pinecone::PineconeClient;

#[async_trait]
impl VectorDatabase for PineconeClient {
    async fn get_list_of_collections(&self) -> Result<Vec<String>, VectorDatabaseError> {
        let mut list_of_namespaces: Vec<String> = vec![];
        let list_of_indexes = get_indexes(self).await;
        for index in list_of_indexes {
            let mut index = self.index(index.as_str()).await.unwrap();
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
        // Need to figure out the the default index name here
        let mut index = self.index("default").await.unwrap();
        let index_stats = index.describe_index_stats(None).await.unwrap();
        if index_stats
            .namespaces
            .contains_key(search_request.clone().collection.as_str())
        {
            let indexed_vectors_count = index_stats
                .namespaces
                .get(search_request.collection.as_str())
                .unwrap()
                .vector_count;
            collection_results.status = VectorDatabaseStatus::Ok;
            collection_results.collection_metadata = Some(CollectionMetadata {
                status: VectorDatabaseStatus::Ok,
                indexed_vectors_count: Some(indexed_vectors_count as u64),
                segments_count: None,
                points_count: None,
            })
        }
        Ok(collection_results)
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
