use serde_json::{Map, Value};
use std::collections::HashMap;

pub fn format_for_n8n(mut metadata_map: HashMap<String, Value>) -> HashMap<String, Value> {
    let mut new_map = HashMap::new();
    let metadata_map_as_serde_map: Map<String, Value> = metadata_map.clone().into_iter().collect();
    new_map.insert(
        "metadata".to_string(),
        Value::Object(metadata_map_as_serde_map),
    );
    if let Some(content) = metadata_map.remove("content") {
        new_map.insert(
            "content"
                .to_string()
                .replace("\"", "")
                .replace("\n", "")
                .replace("\r", "")
                .replace("\n\n", ""),
            content.to_owned(),
        );
    } else {
        log::warn!("Content field was not found in metadata")
    }
    new_map
}
