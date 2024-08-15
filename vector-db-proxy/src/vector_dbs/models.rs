use anyhow::Error as AnyhowError;
use serde::Serialize;
use serde_json::Value;
use std::collections::{BTreeMap, HashMap};
use thiserror;

#[derive(thiserror::Error, Debug)]
pub enum VectorDatabaseError {
    // Anyhow error
    #[error("An error occurred: {0}")]
    AnyhowError(#[from] AnyhowError),
    // #[error("A pinecone error occurred: {0}")]
    // PineconeErrorType(#[from] PineconeError),
    /// Any other error.
    #[error("An error occurred. {0}")]
    Other(String),
}

#[derive(Debug)]
pub enum VectorDatabaseStatus {
    Ok,
    Failure,
    NotFound,
    Error(VectorDatabaseError),
}
pub enum CreateDisposition {
    CreateIfNeeded,
    CreateNever,
}

pub struct Point {
    pub status: VectorDatabaseStatus,
    pub index: String,
    pub vector: Vec<f32>,
    pub payload: Option<HashMap<String, String>>,
}

#[derive(Debug)]
pub struct CollectionsResult {
    pub status: VectorDatabaseStatus,
    pub collection_name: String,
    pub collection_metadata: Option<CollectionMetadata>
}

#[derive(Debug)]
pub struct CollectionMetadata {
    pub status: VectorDatabaseStatus,
    pub indexed_vectors_count: Option<u64>,
    pub segments_count: Option<u64>,
    pub points_count: Option<u64>,
}


#[derive(Debug)]
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

#[derive(Serialize, Clone, Debug)]
pub struct FilterConditions {
    pub must: Vec<HashMap<String, String>>,
    pub must_not: Vec<HashMap<String, String>>,
    pub should: Vec<HashMap<String, String>>,
}

#[derive(Clone, Debug, Serialize)]
pub struct SearchRequest {
    pub collection: String,
    pub id: Option<String>,
    pub vector: Option<Vec<f32>>,
    pub filters: Option<FilterConditions>,
    pub limit: Option<u32>,
    pub get_all_pages: Option<bool>,
}

#[derive(Debug)]
pub struct StorageSize {
    pub status: VectorDatabaseStatus,
    pub collection_name: String,
    pub size: Option<f64>,
    pub points_count: Option<u64>,
}

#[derive(Clone, Debug, Serialize)]
pub enum Distance {
    UnknownDistance = 0,
    Cosine = 1,
    Euclid = 2,
    Dot = 3,
    Manhattan = 4,
}
#[derive(Serialize, Debug, Clone)]
pub struct CollectionCreate {
    pub collection_name: String,
    pub size: u64,
    pub namespace: Option<String>,
    pub distance: Distance,
    pub vector_name: Option<String>,
}

impl From<bool> for VectorDatabaseStatus {
    fn from(value: bool) -> Self {
        match value {
            true => VectorDatabaseStatus::Ok,
            false => VectorDatabaseStatus::Failure,
        }
    }
}
impl From<qdrant_client::qdrant::CollectionInfo> for VectorDatabaseStatus {
    fn from(value: qdrant_client::qdrant::CollectionInfo) -> Self {
        match value.status {
            1 => VectorDatabaseStatus::Ok,
            2 => VectorDatabaseStatus::Failure,
            _ => VectorDatabaseStatus::Error(VectorDatabaseError::Other(String::from("An error \
            occurred")))
        }
    }
}

impl From<Point> for BTreeMap<String, String> {
    fn from(value: Point) -> Self {
        let mut map = BTreeMap::new();
        if let Some(payload) = value.payload {
            map = BTreeMap::from_iter(payload)
        }
        map
    }
}