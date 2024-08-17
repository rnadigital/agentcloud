use crate::vector_databases::models::StorageSize;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Serialize, Deserialize)]
pub enum Status {
    Success,
    Failure,
    DoesNotExist,
    NotFound,
}

#[derive(Serialize, Deserialize)]
pub struct ResponseBody {
    pub status: Status,
    pub data: Option<Value>,
    pub error_message: Option<Value>,
}

#[derive(Serialize, Clone, Debug)]
pub struct CollectionStorageSizeResponse {
    pub list_of_datasources: Vec<StorageSize>,
    pub total_size: f64,
    pub total_points: u64,
}
