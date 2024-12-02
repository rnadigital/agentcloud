use crate::embeddings::helpers::clean_text;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// Unstructured IO Response struct
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UnstructuredIOResponse {
    #[serde(rename = "type")]
    pub field_type: String,
    pub element_id: String,
    pub text: String,
    pub metadata: Metadata,
}
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Metadata {
    pub filetype: String,
    pub languages: Vec<String>,
    pub page_number: Option<i64>,
    pub filename: String,
}

// Construct a HashMap from the Unstructured IO response struct
impl From<&UnstructuredIOResponse> for HashMap<String, String> {
    fn from(value: &UnstructuredIOResponse) -> Self {
        let mut map = HashMap::new();

        // Convert fields of UnstructuredIOResponse to strings and insert them into the map
        map.insert("ac_type".to_string(), value.field_type.clone());
        map.insert("ac_element_id".to_string(), value.element_id.clone());
        map.insert("page_content".to_string(), clean_text(value.text.clone()));
        // Convert fields of Metadata to strings and insert them into the map
        map.insert("ac_filetype".to_string(), value.metadata.filetype.clone());
        map.insert(
            "ac_languages".to_string(),
            value.metadata.languages.join(","),
        );
        if let Some(page_number) = value.metadata.page_number {
            map.insert("ac_page_number".to_string(), page_number.to_string());
        }
        map.insert(
            "metadata.filename".to_string(),
            value.metadata.filename.clone(),
        );

        map
    }
}
