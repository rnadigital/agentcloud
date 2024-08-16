use anyhow::Error as AnyhowError;
use serde::{Deserialize, Serialize};
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

impl Clone for VectorDatabaseError {
    fn clone(&self) -> Self {
        match self {
            VectorDatabaseError::AnyhowError(e) => {
                VectorDatabaseError::Other(e.to_string()) // Convert anyhow::Error to String
            }
            VectorDatabaseError::Other(msg) => VectorDatabaseError::Other(msg.clone()),
        }
    }
}

impl Serialize for VectorDatabaseError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        match self {
            VectorDatabaseError::AnyhowError(err) => {
                serializer.serialize_str(&format!("An error occurred: {}", err))
            }
            VectorDatabaseError::Other(msg) => {
                serializer.serialize_str(&format!("An error occurred. {}", msg))
            }
        }
    }
}

#[derive(Debug, Clone, Serialize)]
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
#[derive(Clone, Deserialize)]
pub struct Point {
    pub index: Option<String>,
    pub vector: Vec<f32>,
    pub payload: Option<HashMap<String, String>>,
}

impl Point {
    pub fn new(
        index: Option<String>,
        vector: Vec<f32>,
        payload: Option<HashMap<String, String>>,
    ) -> Self {
        Point {
            index,
            vector,
            payload,
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SearchResult {
    pub score: Option<f32>,
    pub payload: Option<HashMap<String, String>>,
    pub vector: Option<Vec<f32>>,
}

#[derive(Debug)]
pub struct CollectionsResult {
    pub status: VectorDatabaseStatus,
    pub collection_name: String,
    pub collection_metadata: Option<CollectionMetadata>,
}

#[derive(Debug, Serialize)]
pub struct CollectionMetadata {
    pub status: VectorDatabaseStatus,
    pub indexed_vectors_count: Option<u64>,
    pub segments_count: Option<u64>,
    pub points_count: Option<u64>,
}

#[derive(Debug, Serialize)]
pub struct ScrollResults {
    pub status: VectorDatabaseStatus,
    pub id: String,
    pub payload: HashMap<String, String>,
    pub vector: Vec<f32>,
}

#[derive(Serialize, Debug, Clone)]
pub enum HashMapValues {
    Serde(Value),
    Str(String),
}

#[derive(Serialize, Clone, Debug, Deserialize)]
pub struct FilterConditions {
    pub must: Option<Vec<HashMap<String, String>>>,
    pub must_not: Option<Vec<HashMap<String, String>>>,
    pub should: Option<Vec<HashMap<String, String>>>,
}

impl Default for FilterConditions {
    fn default() -> Self {
        FilterConditions {
            must: None,
            must_not: None,
            should: None,
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SearchResponseParams {
    pub include_vectors: Option<bool>,
    pub include_payload: Option<bool>,
    pub get_all_pages: Option<bool>,
    pub limit: Option<u32>,
}

// This will dictate the type of search that is conducted
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum SearchType {
    Collection,
    Point,
    Similarity,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SearchRequest {
    pub search_type: SearchType,
    pub collection: String,
    pub id: Option<String>,
    pub vector: Option<Vec<f32>>,
    pub filters: Option<FilterConditions>,
    // This will dictate what is included in the response
    pub search_response_params: Option<SearchResponseParams>,
}

impl SearchRequest {
    pub fn new(search_type: SearchType, collection: String) -> Self {
        Self {
            search_type,
            collection,
            id: None,
            vector: None,
            filters: None,
            search_response_params: None,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
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
            _ => VectorDatabaseStatus::Error(VectorDatabaseError::Other(String::from(
                "An error \
            occurred",
            ))),
        }
    }
}

impl From<Point> for BTreeMap<String, String> {
    fn from(value: Point) -> Self {
        BTreeMap::from_iter(value.payload.unwrap_or(HashMap::new()))
    }
}
