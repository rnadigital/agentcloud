use std::collections::HashMap;

pub struct Document {
    pub page_content: String,
    pub metadata: Option<HashMap<String, String>>,
    pub embedding_vector: Option<Vec<f32>>,
}
impl Document {
    pub fn new(
        page_content: String,
        metadata: Option<HashMap<String, String>>,
        embedding_vector: Option<Vec<f32>>,
    ) -> Self {
        Document {
            page_content,
            metadata,
            embedding_vector,
        }
    }
}
