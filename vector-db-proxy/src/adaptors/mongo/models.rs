use crate::data::models::FileType;
use bson::DateTime;
use mongodb::bson::{doc, oid::ObjectId};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

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
    pub file_type: FileType,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DataSources {
    pub _id: ObjectId,
    pub orgId: ObjectId,
    pub teamId: ObjectId,
    pub modelId: Option<ObjectId>,
    pub name: String,
    pub description: Option<String>,
    pub filename: Option<String>,
    pub originalName: String,
    pub sourceType: String,
    pub sourceId: Option<String>,
    pub syncedCount: Option<i32>,
    pub embeddedCount: Option<i32>,
    pub destinationId: Option<String>,
    pub workspaceId: Option<String>,
    pub connectionId: Option<String>,
    pub chunkStrategy: Option<UnstructuredChunkingConfig>,
    pub chunkCharacter: Option<String>,
    pub lastSyncedDate: Option<DateTime>,
    pub embeddingField: Option<String>,
    pub timeWeightField: Option<String>,
    pub createdDate: Option<DateTime>,
    pub status: String,
    pub streamConfig: Option<HashMap<String, StreamConfig>>,
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
}

/// Type alias for a map of field descriptions
pub type FieldDescriptionMap = HashMap<String, FieldDescription>;

/// Struct representing the configuration of a stream
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamConfig {
    pub checkedChildren: Vec<String>,
    pub primaryKey: Vec<String>,
    pub syncMode: SyncMode,
    pub cursorField: Vec<String>,
    pub descriptionsMap: FieldDescriptionMap,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct EmbeddingConfig {
    pub model: Option<Model>,
    pub embedding_key: Option<String>,
    pub primary_key: Option<Vec<String>>,
    pub chunking_strategy: Option<UnstructuredChunkingConfig>,
}
