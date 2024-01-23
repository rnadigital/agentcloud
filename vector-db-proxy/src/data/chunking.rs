use crate::data::{models::Document, text_splitting::SemanticChunker};
use anyhow::Result;
use lopdf::{Dictionary, Object};
use std::collections::HashMap;
pub enum ChunkingStrategy {
    SEMANTIC_CHUNKING,
    CODE_SPLIT,
}

pub trait Chunking {
    type Item;
    fn default() -> Self;
    fn dictionary_to_hashmap(&self, dict: &Dictionary) -> HashMap<String, String>;
    fn extract_text_from_pdf(&self, file: Vec<u8>) -> Result<(String, HashMap<String, String>)>;
    async fn chunk(
        &self,
        data: String,
        metadata: Option<HashMap<String, String>>,
        strategy: ChunkingStrategy,
    ) -> Result<String>;
}

pub struct PdfChunker;

impl Chunking for PdfChunker {
    type Item = u8;

    fn default() -> Self {
        PdfChunker
    }

    fn dictionary_to_hashmap(&self, dict: &Dictionary) -> HashMap<String, String> {
        let mut map = HashMap::new();
        for (key, value) in dict {
            let key_str = String::from_utf8_lossy(key).into_owned();
            let value_str = match value {
                Object::String(ref s, _) | Object::Name(ref s) => {
                    String::from_utf8_lossy(s).into_owned()
                }
                Object::Integer(i) => i.to_string(),
                Object::Real(f) => f.to_string(),
                Object::Boolean(b) => b.to_string(),
                Object::Array(ref arr) => {
                    // Handling array, customize as needed
                    format!(
                        "{:?}",
                        arr.iter()
                            .map(|obj| obj.as_string().unwrap().to_string())
                            .collect::<Vec<String>>()
                    )
                }
                Object::Dictionary(ref dict) => {
                    // Handling dictionary, customize as needed
                    "Nested Dictionary".to_string()
                }
                Object::Stream(ref stream) => {
                    // Handling stream, customize as needed
                    "Stream Data".to_string()
                }
                _ => "Unknown Type".to_string(),
            };
            map.insert(key_str, value_str);
        }
        map
    }

    fn extract_text_from_pdf(&self, file: Vec<u8>) -> Result<(String, HashMap<String, String>)> {
        let mut text = String::new(); // we will instantiate this so we always have something to return
        let mut metadata = HashMap::new();
        if let Ok(doc) = lopdf::Document::load_mem(&*file) {
            // Change this to load from mem
            let pages = doc.get_pages();
            for (page_id, page) in pages {
                let page_content = doc.get_page_content(page).unwrap();
                let page_dict = doc.get_dictionary(page)?;
                text = pdf_extract::extract_text_from_mem(&*page_content).unwrap();
                metadata = self.dictionary_to_hashmap(page_dict);
                metadata.insert("page_number".to_string(), page_id.to_string());
            }
        }
        let res = (text, metadata);
        // println!("Final Text: {}", text);
        Ok(res)
    }

    async fn chunk(
        &self,
        data: String,
        metadata: Option<HashMap<String, String>>,
        strategy: ChunkingStrategy,
    ) -> Result<String> {
        match strategy {
            ChunkingStrategy::SEMANTIC_CHUNKING => {
                let chunker = SemanticChunker::default();
                let doc = Document {
                    page_content: data,
                    metadata,
                };
                chunker.split_documents(vec![doc]).await;
            }
            ChunkingStrategy::CODE_SPLIT => {}
        }

        Ok(String::new())
    }
}
