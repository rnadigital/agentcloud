use chrono::Utc;
use mongodb::bson::{doc, oid::ObjectId};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Serialize, Deserialize, Clone)]
pub struct DatasourceConnectionSettings {
    pub syncCatalog: Value,
    pub scheduleType: String,
    pub namespaceDefinition: String,
    pub namespaceFormat: Option<String>,
    pub nonBreakingSchemaUpdatesBehavior: String,
    pub prefix: Option<String>,
    pub name: String,
    pub sourceId: String,
    pub destinationId: String,
    pub status: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct DataSources {
    pub _id: ObjectId,
    pub orgId: ObjectId,
    pub teamId: ObjectId,
    pub modelId: Option<ObjectId>,
    pub name: String,
    pub originalName: String,
    pub gcsFilename: String,
    pub sourceType: String,
    pub sourceId: Option<String>,
    pub destinationId: Option<String>,
    pub workspaceId: Option<String>,
    pub connectionId: Option<String>,
    pub chunkStrategy: Option<String>,
    pub chunkCharacter: Option<String>,
    pub connectionSettings: Option<DatasourceConnectionSettings>,
    pub lastSyncedDate: Option<chrono::DateTime<Utc>>,
    pub discoveredSchema: Option<Value>,
}
#[derive(Serialize, Deserialize)]
pub enum ChunkingStrategy {
    SEMANTIC_CHUNKING,
    CHARACTER_CHUNKING,
    CODE_SPLIT,
    UNKNOWN,
}
impl From<String> for ChunkingStrategy {
    fn from(value: String) -> Self {
        match value.as_str() {
            "semantic" => ChunkingStrategy::SEMANTIC_CHUNKING,
            "character" => ChunkingStrategy::CHARACTER_CHUNKING,
            "code" => ChunkingStrategy::CODE_SPLIT,
            _ => ChunkingStrategy::UNKNOWN,
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Model {
    pub _id: ObjectId,
    pub orgId: ObjectId,
    pub teamId: ObjectId,
    pub credentialId: ObjectId,
    pub name: String,
    pub model: String,
    pub embeddingLength: i32,
}
