use regex::Regex;
use serde_json::{Map, Value};
use std::collections::HashMap;

fn _custom_format_metadata(mut metadata_map: HashMap<String, Value>) -> HashMap<String, Value> {
    let mut new_map = HashMap::new();
    let metadata_map_as_serde_map: Map<String, Value> = metadata_map.clone().into_iter().collect();
    new_map.insert(
        "metadata".to_string(),
        Value::Object(metadata_map_as_serde_map),
    );
    if let Some(content) = metadata_map.remove("content") {
        let clean_text = clean_text(content.to_string());
        new_map.insert("content".to_string(), Value::String(clean_text));
    } else {
        log::warn!("Content field was not found in metadata")
    }
    new_map
}

pub fn clean_text(text: String) -> String {
    let re_back_slash = Regex::new(r"\\").unwrap();
    let re = Regex::new(r#"(?:[\\"\n\r]|\\[nr])+"#).unwrap();
    let phase_1 = re.replace_all(&text, "").into_owned();
    re_back_slash.replace_all(&phase_1, "").into_owned()
}
