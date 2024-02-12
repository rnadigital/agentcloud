use crate::data::{models::Document, text_splitting::Chunker};
use crate::mongo::models::ChunkingStrategy;
use anyhow::{anyhow, Result};

use lopdf::{Dictionary, Object};
use std::collections::HashMap;
use std::fs;
use std::io::Read;

extern crate dotext;

use crate::llm::models::EmbeddingModels;
use dotext::*;

pub trait Chunking {
    type Item;
    fn default() -> Self;
    fn dictionary_to_hashmap(&self, dict: &Dictionary) -> HashMap<String, String>;
    fn extract_text_from_pdf(&self, path: String) -> Result<(String, HashMap<String, String>)>;
    fn extract_text_from_docx(&self, path: String) -> Result<(String, HashMap<String, String>)>;
    fn extract_text_from_txt(&self, path: String) -> Result<(String, HashMap<String, String>)>;
    async fn chunk(
        &self,
        data: String,
        metadata: Option<HashMap<String, String>>,
        strategy: ChunkingStrategy,
        chunking_character: Option<String>,
        embedding_model: EmbeddingModels,
    ) -> Result<Vec<Document>>;
}

pub struct TextChunker;

impl Chunking for TextChunker {
    type Item = u8;

    fn default() -> Self {
        TextChunker
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
                    // Handling array elements individually
                    let array_str = arr
                        .iter()
                        .map(|obj| match obj {
                            Object::String(ref s, _) | Object::Name(ref s) => {
                                String::from_utf8_lossy(s).into_owned()
                            }
                            Object::Integer(i) => i.to_string(),
                            Object::Real(f) => f.to_string(),
                            Object::Boolean(b) => b.to_string(),
                            _ => "Unknown Type".to_string(),
                        })
                        .collect::<Vec<String>>()
                        .join(", "); // Join elements with a delimiter if needed
                    format!("[{}]", array_str)
                }
                Object::Dictionary(ref dict) => {
                    // Handling nested dictionary
                    let nested_dict = self.dictionary_to_hashmap(dict);
                    serde_json::to_string(&nested_dict)
                        .unwrap_or_else(|_| "Invalid JSON".to_string())
                }
                Object::Stream(ref stream) => {
                    // Handling stream, customize as needed
                    println!("Stream Data: {:?}", stream);
                    "Stream Data".to_string()
                }
                _ => "Unknown Type".to_string(),
            };
            map.insert(key_str, value_str);
        }
        map
    }

    fn extract_text_from_pdf(&self, path: String) -> Result<(String, HashMap<String, String>)> {
        let mut metadata = HashMap::new();
        let mut res = (String::new(), metadata);
        if let Ok(doc) = lopdf::Document::load(path.as_str()) {
            let pages = doc.get_pages();
            if let Some((page_id, page)) = pages.into_iter().next() {
                return match pdf_extract::extract_text(path.as_str()) {
                    Ok(text) => {
                        let page_dict = doc.get_dictionary(page)?;
                        metadata = self.dictionary_to_hashmap(page_dict);
                        metadata.insert("page_number".to_string(), page_id.to_string());
                        res = (text, metadata);
                        Ok(res)
                    }
                    Err(e) => Err(anyhow!(
                        "An error occurred while trying to extract text from pdf. Error: {}",
                        e
                    )),
                };
            }
        }
        Ok(res)
    }
    // this method covers docx, xlsx and pptx
    fn extract_text_from_docx(&self, path: String) -> Result<(String, HashMap<String, String>)> {
        let metadata = HashMap::new();
        let mut docx = String::new();
        let mut file = Docx::open(path.as_str()).expect("Cannot open file");
        file.read_to_string(&mut docx).unwrap();

        let results = (docx, metadata);
        Ok(results)
    }

    fn extract_text_from_txt(&self, path: String) -> Result<(String, HashMap<String, String>)> {
        let metadata = HashMap::new();
        let mut text = String::new();

        match fs::read_to_string(path) {
            Ok(t) => text = t,
            Err(e) => {
                return Err(anyhow!("Could  not read file. Error: {}", e));
            }
        }

        let results = (text, metadata);
        Ok(results)
    }

    async fn chunk(
        &self,
        data: String,
        metadata: Option<HashMap<String, String>>,
        strategy: ChunkingStrategy,
        chunking_character: Option<String>,
        embedding_model: EmbeddingModels,
    ) -> Result<Vec<Document>> {
        let chunker = Chunker::new(embedding_model, true, Some(strategy), chunking_character);
        let doc = Document {
            page_content: data,
            metadata,
            embedding_vector: None,
        };
        let Ok(results) = chunker.split_documents(vec![doc]).await else {
            return Err(anyhow!("Chunker returned an empty document!"));
        };
        Ok(results)
    }
}
