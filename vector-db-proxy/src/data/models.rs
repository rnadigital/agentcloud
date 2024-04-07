use std::collections::HashMap;
use std::hash::{Hash, Hasher};
use ndarray::Array1;

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
    CSV,
    DOCX,
    UNKNOWN,
}

impl From<String> for FileType {
    fn from(value: String) -> Self {
        match value.as_str() {
            "pdf" => Self::PDF,
            "txt" => Self::TXT,
            "csv" => Self::CSV,
            "docx" | "pptx" | "xlsx" | "odt" | "ods" | "odp" => Self::DOCX,
            _ => Self::UNKNOWN,
        }
    }
}

// `Sentence` is a struct that holds the embedding and other metadata
#[derive(Clone, Debug)]
pub struct Sentence {
    pub sentence_embedding: Array1<f32>,
    pub distance_to_next: Option<f32>,
    pub sentence: Option<String>,
}

// a sentence should also have the associated text
impl Default for Sentence {
    fn default() -> Self {
        Sentence {
            sentence_embedding: Array1::from_vec(vec![]),
            distance_to_next: None,
            sentence: None,
        }
    }
}
