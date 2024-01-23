use std::collections::HashMap;

pub struct Document {
    pub page_content: String,
    pub metadata: Option<HashMap<String, String>>,
}
impl Document {
    pub fn new(page_content: String, metadata: Option<HashMap<String, String>>) -> Self {
        Document {
            page_content,
            metadata,
        }
    }
}
