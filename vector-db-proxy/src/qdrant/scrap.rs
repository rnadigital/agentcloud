use std::collections::HashMap;
use anyhow::anyhow;
use bson::to_document;
use qdrant_client::client::QdrantClient;
use qdrant_client::qdrant::{CreateCollection, VectorParams, VectorsConfig};
use crate::vectors::vector_source::VectorSource;
use crate::qdrant::client::instantiate_qdrant_client;

pub struct QdrantVectorStore {
    client: QdrantClient,
}


impl VectorSource for QdrantVectorStore {
    type Item = QdrantVectorStore;
    async fn connect(&self, connection_string: Option<String>) -> Option<Self::Item> {
        let connection = instantiate_qdrant_client(connection_string).await.unwrap();
        return Some(
            QdrantVectorStore {
                client: connection
            }
        );
    }
    async fn list_collections(&self) -> Option<Vec<String>> {
        log::debug!("Getting list of collection from DB...");
        let qdrant_conn = &self.client;
        let results = qdrant_conn.list_collections().await.unwrap();
        let list_of_collection: Vec<String> = results
            .collections
            .iter()
            .map(|col| col.name.clone())
            .collect();
        Some(list_of_collection)
    }

    async fn collection_exists(&self, collection_name: String) -> anyhow::Result<bool> {
        let does_collection_exist = &self.client.collection_exists(collection_name).await.unwrap();
        Ok(does_collection_exist.to_owned())
    }
    async fn delete_collection(&self, collection_name: String) -> anyhow::Result<bool> {
        match &self.client.delete_collection(collection_name.as_str()).await {
            Ok(res) => {
                Ok(res.result)
            }
            Err(e) => {
                Err(anyhow!("an error occurred while attempting to delete the collection {}. Error: {}", collection_name, e))
            }
        }
    }

    async fn create_collection<T>(&self, collection_name: String, options: T) -> anyhow::Result<()> {
        let vector_config = 
        let result = &self.client.create_collection(options).await.unwrap().result;
        Ok(())
    }

    async fn upsert_data_point<T>(&self, collection_name: String, point: HashMap<String, String>, options: T) -> anyhow::Result<()> {
        todo!()
    }

    async fn upsert_data_points<T>(&self, collection_name: String, point: Vec<HashMap<String, String>>, options: T) -> anyhow::Result<()> {
        todo!()
    }
} 



