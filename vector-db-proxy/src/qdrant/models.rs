use serde_json::Value;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::fmt;


#[derive(Serialize, Deserialize)]
pub struct MyPoint {
    pub index: String,
    pub vector: Vec<f32>,
    pub payload: Value,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PointSearchResults {
    pub score: f32,
    pub payload: HashMap<String, qdrant_client::prelude::Value>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GetCollectionsResults {
    pub collection_name: String,
}

pub enum CreateDisposition {
    CreateIfNeeded,
    CreateNever,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ScrollResults {
    pub id: String,
    pub payload: HashMap<String, qdrant_client::qdrant::Value>,
    pub vector: Vec<f32>,
}

#[derive(Serialize, Debug, Clone)]
pub enum HashMapValues {
    Serde(Value),
    Str(String),
}

impl fmt::Display for HashMapValues {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            HashMapValues::Serde(serde) => write!(f, "{}", Value::to_string(serde)),
            HashMapValues::Str(s) => write!(f, "{}", s.to_owned()),
        }
    }
}