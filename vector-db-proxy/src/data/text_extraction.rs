extern crate dotext;

use anyhow::{anyhow, Result};
use lopdf::{Dictionary, Object};
use std::collections::HashMap;
use std::fs;
use std::io::Read;
use crossbeam::channel::Sender;
use dotext::*;
use crate::messages::task_handoff::send_task;

pub struct TextExtraction;

impl TextExtraction {
    pub fn default() -> Self { Self }
    pub fn dictionary_to_hashmap(&self, dict: &Dictionary) -> HashMap<String, String> {
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
                    log::debug!("Stream Data: {:?}", stream);
                    "Stream Data".to_string()
                }
                _ => "Unknown Type".to_string(),
            };
            map.insert(key_str, value_str);
        }
        map
    }

    pub fn extract_text_from_pdf(&self, path: String) -> Result<(String, HashMap<String, String>)> {
        let mut metadata = HashMap::new();
        match lopdf::Document::load(path.as_str()) {
            Ok(doc) => {
                // metadata = self.detect_pdf_fonts(&doc);
                let mut res = (String::new(), metadata);
                let pages = doc.get_pages();
                if let Some((_, page)) = pages.into_iter().next() {
                    return match pdf_extract::extract_text(path.as_str()) {
                        Ok(text) => {
                            let page_dict = doc.get_dictionary(page)?;
                            metadata = self.dictionary_to_hashmap(page_dict);
                            if text.is_empty() {
                                return Err(anyhow!(
                                    "Unable to extract text from PDF document: {}",
                                    path
                                ));
                            }
                            metadata.insert("character count".to_string(), text.len().to_string());
                            res = (text, metadata);
                            Ok(res)
                        }
                        Err(e) => Err(anyhow!(
                            "An error occurred while trying to extract text from pdf. Error: {}",
                            e
                        )),
                    };
                }
                Ok(res)
            }
            Err(e) => Err(anyhow!(
                "An error occurred while attempting to load PDF doc: {}",
                e
            )),
        }
    }
    // this method covers docx, xlsx and pptx
    pub fn extract_text_from_docx(&self, path: String) -> Result<(String, HashMap<String, String>)> {
        let metadata = HashMap::new();
        let mut docx = String::new();
        let mut file = Docx::open(path.as_str()).expect("Cannot open file");
        file.read_to_string(&mut docx)?;

        let results = (docx, metadata);
        Ok(results)
    }
    pub fn extract_text_from_txt(&self, path: String) -> Result<(String, HashMap<String, String>)> {
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

    pub async fn extract_text_from_csv(
        &self,
        path: String,
        datasource_id: String,
        sender: Sender<(String, String)>,
    ) {
        match csv::Reader::from_path(path) {
            Ok(mut rdr) => {
                for row in rdr.records() {
                    match row {
                        Ok(record) => {
                            let string_record = record.iter().collect::<Vec<&str>>().join(", ");
                            let ds_clone = datasource_id.clone();
                            let sender_clone = sender.clone();
                            send_task(sender_clone, (ds_clone, string_record)).await;
                        }
                        Err(e) => { log::error!("An error occurred {}", e); }
                    }
                }
            }
            Err(e) => {
                log::error!("An error occurred: {} ", e);
            }
        }
    }
}
