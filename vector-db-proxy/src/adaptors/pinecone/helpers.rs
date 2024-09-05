use crate::vector_databases::error::VectorDatabaseError;
use crate::vector_databases::models::VectorDatabaseStatus;
use pinecone_sdk::models::{IndexModel, Namespace, Vector};
use pinecone_sdk::pinecone::data::Index;
use pinecone_sdk::pinecone::PineconeClient;
use std::sync::Arc;

pub async fn get_namespaces_for_index(
    client: &PineconeClient,
    index: &IndexModel,
) -> Option<Vec<String>> {
    if let Ok(mut index) = client.index(index.name.as_str()).await {
        if let Ok(index_stats) = index.describe_index_stats(None).await {
            let namespaces = index_stats
                .namespaces
                .iter()
                .map(|(k, _)| k.clone())
                .collect();
            return Some(namespaces);
        };
    }
    None
}

pub async fn get_indexes(client: &PineconeClient) -> Vec<String> {
    let mut list_of_indexes: Vec<String> = vec![];
    if let Ok(index_list) = client.list_indexes().await {
        if let Some(vec_of_indexes) = index_list.clone().indexes {
            list_of_indexes = vec_of_indexes.iter().map(|i| i.clone().name).collect();
        }
    };
    list_of_indexes
}

pub async fn get_index_model(
    client: &PineconeClient,
    collection_name: String,
) -> Result<IndexModel, VectorDatabaseError> {
    match client.describe_index(collection_name.as_str()).await {
        Ok(index_model) => Ok(index_model),
        Err(e) => {
            println!("Pinecone Error: {}", e);
            Err(VectorDatabaseError::NotFound(e.to_string()))
        }
    }
}

pub async fn upsert(
    mut index: Index,
    vectors: &[Vector],
    namespace: &Namespace,
) -> Result<VectorDatabaseStatus, VectorDatabaseError> {
    match index.upsert(&vectors, &namespace).await {
        Ok(status) => {
            if status.upserted_count == 1 {
                Ok(VectorDatabaseStatus::Ok)
            } else {
                Ok(VectorDatabaseStatus::Failure)
            }
        }
        Err(e) => Err(VectorDatabaseError::PineconeError(Arc::new(e))),
    }
}
