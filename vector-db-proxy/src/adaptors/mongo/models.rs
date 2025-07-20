use crate::data::models::FileType;
use bson::DateTime;
use mongodb::bson::{doc, oid::ObjectId};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::fmt::Display;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DatasourceConnectionSettings {
    pub syncCatalog: Value,
    pub scheduleType: String,
    pub namespaceDefinition: Option<String>,
    pub namespaceFormat: Option<String>,
    pub nonBreakingSchemaUpdatesBehavior: String,
    pub prefix: Option<String>,
    pub name: String,
    pub sourceId: String,
    pub destinationId: String,
    pub status: String,
}

#[derive(Debug, PartialEq, Eq, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum UnstructuredChunkingStrategy {
    Basic,
    ByTitle,
    ByPage,
    BySimilarity,
}

impl UnstructuredChunkingStrategy {
    pub fn from_str(strategy: &str) -> Option<Self> {
        match strategy {
            "basic" => Some(Self::Basic),
            "by_title" => Some(Self::ByTitle),
            "by_page" => Some(Self::ByPage),
            "by_similarity" => Some(Self::BySimilarity),
            _ => None,
        }
    }

    pub fn as_str<'a>(strategy: &Self) -> &'a str {
        match strategy {
            Self::Basic => "basic",
            Self::ByTitle => "by_title",
            Self::ByPage => "by_page",
            Self::BySimilarity => "by_similarity",
        }
    }
}

#[derive(Debug, PartialEq, Eq, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum UnstructuredPartitioningStrategy {
    Auto,
    Fast,
    HiRes,
    OcrOnly,
}

impl UnstructuredPartitioningStrategy {
    pub fn from_str(strategy: &str) -> Option<Self> {
        match strategy {
            "auto" => Some(Self::Auto),
            "fast" => Some(Self::Fast),
            "hi_res" => Some(Self::HiRes),
            "ocr_only" => Some(Self::OcrOnly),
            _ => None,
        }
    }

    pub fn as_str<'a>(strategy: &Self) -> &'a str {
        match strategy {
            Self::Auto => "auto",
            Self::Fast => "fast",
            Self::HiRes => "hi_res",
            Self::OcrOnly => "ocr_only",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnstructuredChunkingConfig {
    pub partitioning: UnstructuredPartitioningStrategy,
    pub strategy: UnstructuredChunkingStrategy,
    pub max_characters: usize,
    pub new_after_n_chars: usize,
    pub overlap: usize,
    pub similarity_threshold: f64, // between 0.0 and 1.0
    pub overlap_all: bool,
    pub file_type: Option<FileType>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DataSources {
    #[serde(rename = "_id")]
    pub id: ObjectId,
    pub org_id: ObjectId,
    pub team_id: ObjectId,
    pub model_id: Option<ObjectId>,
    pub name: String,
    pub description: Option<String>,
    pub filename: Option<String>,
    pub original_name: String,
    pub source_type: String,
    pub source_id: Option<String>,
    pub synced_count: Option<i32>,
    pub embedded_count: Option<i32>,
    pub destination_id: Option<String>,
    pub workspace_id: Option<String>,
    pub connection_id: Option<String>,
    #[serde(default)]
    pub chunking_config: Option<UnstructuredChunkingConfig>,
    pub last_synced_date: Option<DateTime>,
    pub embedding_field: Option<String>,
    pub time_weight_field: Option<String>,
    pub created_date: Option<DateTime>,
    pub status: String,
    pub byo_vector_db: Option<bool>,
    pub collection_name: Option<String>,
    pub namespace: Option<String>,
    #[serde(default)]
    pub stream_config: Option<HashMap<String, StreamConfig>>,
    pub discovered_schema: Option<bson::Document>,
    pub vector_db_id: Option<ObjectId>,
    #[serde(flatten)]
    pub extra_fields: bson::Document,
    pub region: Option<String>,
    pub cloud: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ModelConfig {
    pub api_key: Option<String>,
    pub org_id: Option<String>,
    pub base_url: Option<String>,
    pub cohere_api_key: Option<String>,
    pub groq_api_key: Option<String>,
    // Add more fields here if needed
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Model {
    pub _id: ObjectId,
    pub orgId: ObjectId,
    pub teamId: ObjectId,
    pub name: String,
    pub model: String,
    pub embeddingLength: i32,
    pub modelType: String,
    pub config: ModelConfig,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CredentialsObj {
    pub key: Option<String>,
    pub endpoint: Option<String>,
    pub org: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Credentials {
    pub _id: ObjectId,
    pub orgId: ObjectId,
    pub teamId: ObjectId,
    pub name: String,
    pub createdDate: Option<DateTime>,
    pub credentials: Option<CredentialsObj>,
}
/// Enum representing the sync modes
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SyncMode {
    FullRefreshOverwrite,
    FullRefreshAppend,
    IncrementalAppend,
    IncrementalDedupedHistory,
}

/// Conversion from &str to SyncMode enum
impl std::str::FromStr for SyncMode {
    type Err = ();

    fn from_str(input: &str) -> Result<SyncMode, Self::Err> {
        match input {
            "full_refresh_overwrite" => Ok(SyncMode::FullRefreshOverwrite),
            "full_refresh_append" => Ok(SyncMode::FullRefreshAppend),
            "incremental_append" => Ok(SyncMode::IncrementalAppend),
            "incremental_deduped_history" => Ok(SyncMode::IncrementalDedupedHistory),
            _ => Err(()),
        }
    }
}

/// Struct representing the description of a field
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldDescription {
    pub description: String,
    #[serde(rename = "type")]
    pub field_type: String, // escaping `type` because it's a reserved keyword in Rust
    #[serde(flatten)]
    pub extra_fields: HashMap<String, Value>,
}

/// Type alias for a map of field descriptions
//pub type FieldDescriptionMap = bson::Document;

/// Struct representing the configuration of a stream
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamConfig {
    pub checkedChildren: Vec<String>,
    pub primaryKey: Vec<String>,
    pub syncMode: SyncMode,
    pub cursorField: Vec<String>,
    pub descriptionsMap: bson::Document,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct EmbeddingConfig {
    pub model: Option<Model>,
    pub embedding_key: Option<String>,
    pub primary_key: Option<Vec<String>>,
    pub chunking_strategy: Option<UnstructuredChunkingConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
//#[serde(deny_unknown_fields)]
pub struct VectorDbs {
    pub _id: ObjectId,
    pub orgId: ObjectId,
    pub teamId: ObjectId,
    pub apiKey: Option<String>,
    pub url: Option<String>,
    pub r#type: VectorDatabaseType,
    pub name: String,
    pub createdAt: DateTime,
    pub updatedAt: DateTime,
}
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub enum VectorDatabaseType {
    pinecone,
    #[default]
    qdrant,
    unknown,
}
impl From<String> for VectorDatabaseType {
    fn from(value: String) -> Self {
        match value.as_str() {
            "qdrant" => VectorDatabaseType::qdrant,
            "pinecone" => VectorDatabaseType::pinecone,
            _ => VectorDatabaseType::unknown,
        }
    }
}

impl Display for VectorDatabaseType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let str = match self {
            VectorDatabaseType::pinecone => "pinecone".to_string(),
            VectorDatabaseType::qdrant => "qdrant".to_string(),
            _ => "Unknown".to_string(),
        };
        write!(f, "{}", str)
    }
}
