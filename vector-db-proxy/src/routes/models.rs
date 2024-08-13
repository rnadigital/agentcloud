use crate::adaptors::qdrant::models::CollectionStorageSize;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

#[derive(Serialize, Deserialize)]
pub enum Status{
    Success,
    Failure,
    DoesNotExist,
    NotFound
}

#[derive(Serialize, Deserialize)]
pub struct ResponseBody{
    pub status: Status,
    pub data: Option<Value>,
    pub error_message: Option<Value>
}

#[derive(Serialize, Deserialize, Clone)]
pub struct FilterConditions{
    pub must: Vec<HashMap<String, String>>,
    pub must_not: Vec<HashMap<String, String>>,
    pub should: Vec<HashMap<String, String>>,
}


#[derive(Serialize, Deserialize, Clone)]
pub struct SearchRequest{
    pub vector: Option<Vec<f32>>,
    pub filters: Option<FilterConditions>,
    pub limit: Option<u32>,
    pub get_all_pages: Option<bool>
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Prompt{
    pub prompt: Vec<String>,
    pub filters: Option<FilterConditions>,
    pub limit: Option<u64>
}


#[derive(Serialize, Clone, Debug)]
pub struct CollectionStorageSizeResponse {
    pub list_of_datasources: Vec<CollectionStorageSize>,
    pub total_size: f64,
    pub total_points: u64,
}
