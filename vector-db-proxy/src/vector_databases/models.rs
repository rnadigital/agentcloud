use crate::embeddings::helpers::clean_text;
use crate::utils::conversions::{condition_to_hash_map, convert_hashmap_to_qdrant_filters};
use crate::vector_databases::error::VectorDatabaseError;
use crate::vector_databases::helpers;
use pinecone_sdk::models::Cloud as PineconeCloud;
use pinecone_sdk::models::{Metric, Vector};
use prost_types::value::Kind;
use prost_types::Struct as Metadata;
use qdrant_client::qdrant::Filter;
use serde::{Deserialize, Serialize};
use serde_json::Value;
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
#[derive(Clone, Deserialize, Debug)]
pub struct Point {
    pub index: Option<Value>,
    pub vector: Vec<f32>,
    pub payload: Option<HashMap<String, Value>>,
}

impl Point {
    pub fn new(
        index: Option<Value>,
        vector: Vec<f32>,
        payload: Option<HashMap<String, Value>>,
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
    pub payload: Option<HashMap<String, Value>>,
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

impl From<FilterConditions> for Filter {
    fn from(value: FilterConditions) -> Self {
        let (must, must_not, should) = convert_hashmap_to_qdrant_filters(&Some(value));
        Filter {
            must,
            must_not,
            should,
            min_should: None,
        }
    }
}

impl From<Filter> for FilterConditions {
    fn from(value: Filter) -> Self {
        Self {
            must: if value.must.is_empty() {
                None
            } else {
                Some(
                    value
                        .must
                        .into_iter()
                        .map(|condition| {
                            // Assuming `Condition` has a method `to_hash_map` or similar
                            condition_to_hash_map(condition)
                        })
                        .collect(),
                )
            },
            must_not: if value.must_not.is_empty() {
                None
            } else {
                Some(
                    value
                        .must_not
                        .into_iter()
                        .map(|condition| {
                            // Convert each condition to a HashMap<String, String>
                            condition_to_hash_map(condition)
                        })
                        .collect(),
                )
            },
            should: if value.should.is_empty() {
                None
            } else {
                Some(
                    value
                        .should
                        .into_iter()
                        .map(|condition| {
                            // Convert each condition to a HashMap<String, String>
                            condition_to_hash_map(condition)
                        })
                        .collect(),
                )
            },
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
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum SearchType {
    Collection,
    Point,
    Similarity,
    ChunkedRow,
}

impl Default for SearchType {
    fn default() -> Self {
        SearchType::Collection
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SearchRequest {
    pub search_type: SearchType,
    pub collection: String,
    pub namespace: Option<String>,
    pub id: Option<String>,
    pub vector: Option<Vec<f32>>,
    pub filters: Option<FilterConditions>,
    pub search_response_params: Option<SearchResponseParams>,
    pub region: Option<Region>,
    pub byo_vector_db: Option<bool>,
    pub cloud: Option<Cloud>,
    pub top_k: Option<u32>,
}

impl SearchRequest {
    pub fn new(search_type: SearchType, collection: String) -> Self {
        Self {
            search_type,
            collection,
            namespace: None,
            id: None,
            vector: None,
            filters: None,
            top_k: None,
            byo_vector_db: None,
            search_response_params: None,
            region: Some(Region::US_EAST_1),
            cloud: Some(Cloud::AWS),
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug, Copy)]
pub enum Region {
    US_EAST_1,
    US_WEST_2,
    EU_WEST_1,
    US_CENTRAL_1,
    EU_WEST_4,
    EAST_US_2,
}

impl Default for Region {
    fn default() -> Self {
        Self::US_EAST_1
    }
}

impl Region {
    pub fn to_str<'a>(region: Self) -> &'a str {
        match region {
            Self::US_EAST_1 => "us-east-1",
            Self::US_WEST_2 => "us-west-2",
            Self::EU_WEST_1 => "eu-west-1",
            Self::US_CENTRAL_1 => "us-central1",
            Self::EU_WEST_4 => "europe-west4",
            Self::EAST_US_2 => "eastus2",
        }
    }
    pub fn from_str(region: &str) -> Self {
        match region {
            "us-east-1" => Region::US_EAST_1,
            "us-west-2" => Region::US_WEST_2,
            "eu-west-1" => Region::EU_WEST_1,
            "us-central1" => Region::US_CENTRAL_1,
            "europe-west4" => Region::EU_WEST_4,
            "eastus2" => Region::EAST_US_2,
            _ => panic!("Unknown Pinecone serverless region: {}", region),
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
            "euclidean" => Distance::Euclid,
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
    pub region: Option<String>,
    pub cloud: Option<String>,
    pub index_name: Option<String>,
}
impl CollectionCreate {
    pub fn new(
        collection_name: String,
        dimensions: usize,
        distance: Distance,
        region: String,
        cloud: String,
        index_name: String,
    ) -> Self {
        Self {
            collection_name: collection_name.clone(),
            dimensions,
            distance,
            namespace: None,
            vector_name: None,
            cloud: Some(cloud),
            region: Some(region),
            index_name: Some(index_name),
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

impl From<FilterConditions> for Metadata {
    fn from(value: FilterConditions) -> Self {
        let mut btree_map = BTreeMap::new();
        for pattern in value.must.unwrap() {
            for (k, v) in pattern {
                btree_map.insert(
                    k,
                    prost_types::Value {
                        kind: Some(Kind::StringValue(format!("{}", clean_text(v)))),
                    },
                );
            }
        }

        Self { fields: btree_map }
    }
}
impl From<Point> for BTreeMap<String, Value> {
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
                    kind: Some(Kind::StringValue(format!(
                        "{}",
                        v.to_string().replace("\"", "")
                    ))),
                },
            );
        }

        Self { fields: btree_map }
    }
}
impl From<Metadata> for Point {
    fn from(value: Metadata) -> Self {
        let mut hash_map = HashMap::new();

        for (k, v) in value.fields {
            hash_map.insert(k, helpers::prost_to_serde(&v));
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
            id: value
                .index
                .unwrap_or(Value::String(Uuid::new_v4().to_string()))
                .to_string(),
            values: value.vector,
            sparse_values: None,
            metadata,
        }
    }
}
