use chrono::Utc;
use mongodb::bson::{doc, oid::ObjectId};
use serde::Deserialize;
use serde_json::Value;

#[derive(Deserialize)]
struct DatasourceConnectionSettings {
    syncCatalog: Value,
    scheduleType: String,
    namespaceDefinition: String,
    namespaceFormat: Option<String>,
    nonBreakingSchemaUpdatesBehavior: String,
    prefix: Option<String>,
    name: String,
    sourceId: String,
    destinationId: String,
    status: String,
}

#[derive(Deserialize)]
struct DataSources {
    _id: ObjectId,
    orgId: ObjectId,
    teamId: ObjectId,
    modelId: ObjectId,
    name: String,
    originalName: String,
    gcsFilename: String,
    sourceType: String,
    sourceId: String,
    destinationId: String,
    workspaceId: String,
    connectionId: String,
    connectionSettings: DatasourceConnectionSettings,
    lastSyncedDate: Option<chrono::DateTime<Utc>>,
    discoveredSchema: Value,
}
