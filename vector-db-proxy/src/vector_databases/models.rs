use crate::vector_databases::error::VectorDatabaseError;
use crate::vector_databases::models::Cloud::GCP;
use pinecone_sdk::models::Cloud as PineconeCloud;
use pinecone_sdk::models::{Metric, Vector};
use prost_types::value::Kind;
use prost_types::{ListValue, Struct as Metadata, Struct};
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, HashMap};
use uuid::Uuid;

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
    pub id: String,
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
    pub collection_vector_count: Option<u64>,
    pub metric: Option<Distance>,
    pub dimensions: Option<u64>,
}

#[derive(Debug, Serialize)]
pub struct ScrollResults {
    pub status: VectorDatabaseStatus,
    pub id: String,
    pub payload: HashMap<String, String>,
    pub vector: Vec<f32>,
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
// This will dictate what is included in the response
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
    pub search_response_params: Option<SearchResponseParams>,
    pub region: Option<Region>,
    pub cloud: Option<Cloud>,
    pub top_k: Option<u32>,
}

impl SearchRequest {
    pub fn new(search_type: SearchType, collection: String) -> Self {
        Self {
            search_type,
            collection,
            id: None,
            vector: None,
            filters: None,
            top_k: None,
            search_response_params: None,
            region: Some(Region::US),
            cloud: Some(GCP),
        }
    }
}
#[derive(Serialize, Deserialize, Clone, Debug, Copy)]
pub enum Region {
    US,
    EU,
    AU,
}
impl Default for Region {
    fn default() -> Self {
        Self::US
    }
}

impl Region {
    pub fn to_str<'a>(region: Self) -> &'a str {
        match region {
            Self::US => "us-central1",
            Self::EU => "europe-west4",
            _ => panic!("Unknown Pinecone serverless region"),
        }
    }

    pub fn from_str(region: &str) -> Self {
        match region {
            "us-central1" => Region::US,
            "europe-west4" => Region::EU,
            _ => panic!("Unknown Pinecone serverless region"),
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum Cloud {
    GCP,
    AWS,
    AZURE,
}

impl Default for Cloud {
    fn default() -> Self {
        Self::GCP
    }
}

impl Cloud {
    pub fn to_str<'a>(cloud: Self) -> &'a str {
        match cloud {
            Self::GCP => "gcp",
            Self::AWS => "aws",
            Self::AZURE => "azure",
        }
    }
}

impl From<Cloud> for PineconeCloud {
    fn from(value: Cloud) -> Self {
        match value {
            Cloud::AWS => PineconeCloud::Aws,
            Cloud::GCP => PineconeCloud::Gcp,
            Cloud::AZURE => PineconeCloud::Azure,
        }
    }
}
impl From<PineconeCloud> for Cloud {
    fn from(value: PineconeCloud) -> Self {
        match value {
            PineconeCloud::Aws => Cloud::AWS,
            PineconeCloud::Gcp => Cloud::GCP,
            PineconeCloud::Azure => Cloud::AZURE,
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

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum Distance {
    UnknownDistance = 0,
    Cosine = 1,
    Euclid = 2,
    Dot = 3,
    Manhattan = 4,
}
impl Default for Distance {
    fn default() -> Self {
        Self::Cosine
    }
}
impl From<Metric> for Distance {
    fn from(value: Metric) -> Self {
        match value {
            Metric::Cosine => Distance::Cosine,
            Metric::Dotproduct => Distance::Dot,
            Metric::Euclidean => Distance::Euclid,
        }
    }
}

impl From<Distance> for Metric {
    fn from(value: Distance) -> Self {
        match value {
            Distance::Cosine => Metric::Cosine,
            Distance::Euclid => Metric::Euclidean,
            Distance::Dot => Metric::Dotproduct,
            _ => panic!("Unsupported metric type. {:?}", value),
        }
    }
}

impl From<i32> for Distance {
    fn from(value: i32) -> Self {
        match value {
            1 => Distance::Cosine,
            2 => Distance::Euclid,
            3 => Distance::Dot,
            4 => Distance::Manhattan,
            _ => Distance::UnknownDistance,
        }
    }
}
impl From<&str> for Distance {
    fn from(value: &str) -> Self {
        match value {
            "cosine" => Distance::Cosine,
            "euclidian" => Distance::Euclid,
            "dotproduct" => Distance::Dot,
            "manhattan" => Distance::Manhattan,
            _ => Distance::UnknownDistance,
        }
    }
}
#[derive(Serialize, Debug, Clone, Deserialize)]
pub struct CollectionCreate {
    pub collection_name: String,
    pub dimensions: usize,
    pub namespace: Option<String>,
    pub distance: Distance,
    pub vector_name: Option<String>,
    pub region: Option<Region>,
    pub cloud: Option<Cloud>,
}
impl CollectionCreate {
    pub fn new(
        collection_name: String,
        dimensions: usize,
        distance: Distance,
        region: Region,
    ) -> Self {
        Self {
            collection_name: collection_name.clone(),
            dimensions,
            distance,
            namespace: None,
            vector_name: None,
            cloud: Some(Cloud::AWS),
            region: Some(region),
        }
    }
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

impl From<Point> for Metadata {
    fn from(value: Point) -> Self {
        let mut btree_map = BTreeMap::new();
        for (k, v) in value.payload.unwrap() {
            btree_map.insert(
                k,
                prost_types::Value {
                    kind: Some(prost_types::value::Kind::StringValue(v)),
                },
            );
        }

        Self { fields: btree_map }
    }
}
fn list_value_to_string(list_value: &ListValue) -> Option<String> {
    let values: Vec<String> = list_value
        .values
        .iter()
        .filter_map(|v| value_to_string(&v.kind)) // Recursively handle each value in the list
        .collect();

    Some(format!("[{}]", values.join(", ")))
}
fn struct_value_to_string(struct_value: &Struct) -> Option<String> {
    let mut map = HashMap::new();

    for (key, value) in &struct_value.fields {
        if let Some(value_str) = value_to_string(&value.kind) {
            // Recursively handle each value in the struct
            map.insert(key.clone(), value_str);
        }
    }
    // Return the map as a JSON string
    Some(serde_json::to_string(&map).unwrap_or_else(|_| "{}".to_string()))
}
fn value_to_string(value: &Option<Kind>) -> Option<String> {
    match value {
        Some(kind) => match kind {
            Kind::StringValue(s) => Some(s.to_owned()),
            Kind::NumberValue(n) => Some(n.to_string()),
            Kind::BoolValue(b) => Some(b.to_string()),
            Kind::NullValue(i) => Some(i.to_string()),
            Kind::ListValue(l) => list_value_to_string(l),
            Kind::StructValue(s) => struct_value_to_string(s),
        },
        None => None,
    }
}
impl From<Metadata> for Point {
    fn from(value: Metadata) -> Self {
        let mut hash_map = HashMap::new();

        for (k, v) in value.fields {
            hash_map.insert(k, value_to_string(&v.kind).unwrap());
        }
        Point {
            index: None,
            payload: Some(hash_map),
            vector: vec![],
        }
    }
}

impl From<Point> for Vector {
    fn from(value: Point) -> Self {
        let metadata = Some(Metadata::from(value.clone()));
        Self {
            id: value.index.unwrap_or(Uuid::new_v4().to_string()),
            values: value.vector,
            sparse_values: None,
            metadata,
        }
    }
}
