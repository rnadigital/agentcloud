use std::collections::HashMap;

use serde::Serialize;
use serde_json::Value;
use thiserror;

#[derive(thiserror::Error, Debug, Serialize, Clone)]
pub enum VectorDatabaseError {
    /// Any other error.
    #[error("{0}")]
    Other(&'static str),
}
#[derive(Debug, Serialize, Clone)]
pub enum VectorDatabaseStatus {
    Ok,
    NotFound,
    Error(VectorDatabaseError),
}
pub enum CreateDisposition {
    CreateIfNeeded,
    CreateNever,
}

#[derive(Serialize)]
pub struct Point {
    pub status: VectorDatabaseStatus,
    pub index: String,
    pub vector: Vec<f32>,
    pub payload: Option<HashMap<String, Value>>,
}

#[derive(Debug, Serialize)]
pub struct CollectionsResult {
    pub status: VectorDatabaseStatus,
    pub collection_name: String,
    pub collection_metadata: CollectionMetadata,
}

#[derive(Debug, Serialize)]
pub struct CollectionMetadata {
    pub status: VectorDatabaseStatus,
    pub indexed_vectors_count: Option<u64>,
    pub segments_count: Option<u64>,
    pub points_count: Option<u64>,
}


#[derive(Serialize, Debug)]
pub struct ScrollResults {
    pub status: VectorDatabaseStatus,
    pub id: String,
    pub payload: HashMap<String, Value>,
    pub vector: Vec<f32>,
}

#[derive(Serialize, Debug, Clone)]
pub enum HashMapValues {
    Serde(Value),
    Str(String),
}

#[derive(Serialize, Clone)]
pub struct FilterConditions {
    pub must: Vec<HashMap<String, String>>,
    pub must_not: Vec<HashMap<String, String>>,
    pub should: Vec<HashMap<String, String>>,
}


#[derive(Serialize, Clone)]
pub struct SearchRequest {
    pub status: VectorDatabaseStatus,
    pub collection: String,
    pub id: Option<String>,
    pub vector: Option<Vec<f32>>,
    pub filters: Option<FilterConditions>,
    pub limit: Option<u32>,
    pub get_all_pages: Option<bool>,
}