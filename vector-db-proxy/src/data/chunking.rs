use crate::data::{models::Document, text_splitting::SemanticChunker};
use anyhow::Result;
use std::collections::HashMap;

pub enum ChunkingStrategy {
    SEMANTIC_CHUNKING,
    CODE_SPLIT,
}

pub trait Chunking {
    type Item;
    fn default() -> Self;
    fn extract_text_from_pdf(&self, path: &str) -> Result<(String, HashMap<String, String>)>;
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

    fn extract_text_from_pdf(&self, path: &str) -> Result<(String, HashMap<String, String>)> {
        let mut text = String::new(); // we will instantiate this so we always have something to return
        let mut metadata = HashMap::new();
        if let Ok(doc) = lopdf::Document::load(path) {
            // Change this to load from mem
            let pages = doc.get_pages();
            for (page_id, page) in pages {
                // println!("Page number: {}", page_id);
                text = pdf_extract::extract_text(path).unwrap();
                // if let Some(info_dict) = doc
                //     .trailer
                //     .get("Info".as_ref())
                //     .and_then(|obj| obj.as_dict().unwrap())
                // {
                //     for (key, value) in info_dict {
                //         if let Ok(key_str) = key.as_name_str() {
                //             if let Object::String(value_str, _) = value {
                //                 metadata.insert(key_str.to_string(), value_str);
                //             }
                //         }
                //     }
                // }
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
