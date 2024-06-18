use std::collections::HashMap;
use anyhow::Result;
use crate::init::env_variables::GLOBAL_DATA;
use qdrant_client::qdrant::CreateCollection;

pub async fn get_vector_source() {
    let global_data = GLOBAL_DATA.read().await;
    let vector_source_choice = &global_data.vector_source;
    let vector_store = VectorStores::from(vector_source_choice.to_string());
    let vector_connection = vector_store.connect(String::from("")).await.unwrap();
}

pub trait VectorSource {
    type Item;
    async fn connect(&self, connection_string: Option<String>) -> Option<Self::Item>;
    async fn list_collections(&self) -> Option<Vec<String>>;
    async fn delete_collection(&self, collection_name: String) -> Result<bool>;
    async fn collection_exists(&self, collection_name: String) -> Result<bool>;
    async fn create_collection<T>(&self, collection_name: String, options: T) -> Result<()>;
    async fn upsert_data_point<T>(&self, collection_name: String, point: HashMap<String, String>, options: T) -> Result<()>;
    async fn upsert_data_points<T>(&self, collection_name: String, point: Vec<HashMap<String, String>>, options: T) -> Result<()>;
}

pub enum VectorStores {
    Qdrant,
    PineCone,
    Unknown,
}

impl From<String> for VectorStores {
    fn from(value: String) -> Self {
        match value.as_str() {
            "qdrant" => VectorStores::Qdrant,
            "pinecone" => VectorStores::PineCone,
            _ => VectorStores::Unknown
        }
    }
}

impl VectorSource for VectorStores {
    type Item = ();

    async fn connect(&self, connection_string: Option<String>) -> Option<Self::Item> {
        todo!()
    }
    async fn list_collections(&self) -> Option<Vec<String>> {
        todo!()
    }
    async fn delete_collection(&self, collection_name: String) -> Result<bool> {
        todo!()
    }
    async fn collection_exists(&self, collection_name: String) -> Result<bool> {
        todo!()
    }

    async fn create_collection<T>(&self, collection_name: String, options: T) -> Result<()> {
        todo!()
    }

    async fn upsert_data_point<T>(&self, collection_name: String, point: HashMap<String, String>, options: T) -> Result<()> {
        todo!()
    }

    async fn upsert_data_points<T>(&self, collection_name: String, point: Vec<HashMap<String, String>>, options: T) -> Result<()> {
        todo!()
    }
}


