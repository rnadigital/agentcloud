use std::collections::HashMap;
use std::hash::{Hash, Hasher};

#[derive(Debug, Clone, Default)]
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

impl PartialEq for Document {
    fn eq(&self, other: &Self) -> bool {
        self.page_content == other.page_content
    }
}

impl Eq for Document {}

impl Hash for Document {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.page_content.hash(state);
    }
}
#[derive(Copy, Clone)]
pub enum FileType {
    PDF,
    TXT,
    DOC,
    DOCX,
    UNKNOWN,
}
impl From<String> for FileType {
    fn from(value: String) -> Self {
        match value.as_str() {
            "pdf" => Self::PDF,
            "txt" => Self::TXT,
            "doc" => Self::DOC,
            "docx" => Self::DOCX,
            _ => Self::UNKNOWN,
        }
    }
}
