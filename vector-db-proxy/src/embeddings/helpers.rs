use serde_json::{Map, Value};
use std::collections::HashMap;

pub fn format_for_n8n(metadata_map: HashMap<String, Value>) -> HashMap<String, Value> {
    let mut new_map = HashMap::new();
    let metadata_map_as_serde_map: Map<String, Value> = metadata_map.clone().into_iter().collect();
    new_map.insert(
        "metadata".to_string(),
        Value::Object(metadata_map_as_serde_map),
    );
    new_map
}
