extern crate dotext;
extern crate pdf_extract;
extern crate lopdf;

use anyhow::{anyhow, Result};
use std::collections::HashMap;
use std::fs;
use std::io::Read;
use std::sync::Arc;
use dotext::{Docx, MsDoc};
use pdf_extract::*;
use lopdf::*;
use mongodb::Database;
use qdrant_client::client::QdrantClient;
use tokio::sync::{RwLock};

use crate::queue::queuing::Pool;
use crate::queue::add_tasks_to_queues::add_message_to_embedding_queue;

pub struct TextExtraction;

impl TextExtraction {
    pub fn default() -> Self { Self }
    // fn dictionary_to_hashmap(&self, dict: &Dictionary) -> HashMap<String, String> {
    //     let mut map = HashMap::new();
    //     for (key, value) in dict {
    //         let key_str = String::from_utf8_lossy(key).into_owned();
    //         let value_str = match value {
    //             Object::String(ref s, _) | Object::Name(ref s) => {
    //                 String::from_utf8_lossy(s).into_owned()
    //             }
    //             Object::Integer(i) => i.to_string(),
    //             Object::Real(f) => f.to_string(),
    //             Object::Boolean(b) => b.to_string(),
    //             Object::Array(ref arr) => {
    //                 // Handling array elements individually
    //                 let array_str = arr
    //                     .iter()
    //                     .map(|obj| match obj {
    //                         Object::String(ref s, _) | Object::Name(ref s) => {
    //                             String::from_utf8_lossy(s).into_owned()
    //                         }
    //                         Object::Integer(i) => i.to_string(),
    //                         Object::Real(f) => f.to_string(),
    //                         Object::Boolean(b) => b.to_string(),
    //                         _ => "Unknown Type".to_string(),
    //                     })
    //                     .collect::<Vec<String>>()
    //                     .join(", "); // Join elements with a delimiter if needed
    //                 format!("[{}]", array_str)
    //             }
    //             Object::Dictionary(ref dict) => {
    //                 // Handling nested dictionary
    //                 let nested_dict = self.dictionary_to_hashmap(dict);
    //                 serde_json::to_string(&nested_dict)
    //                     .unwrap_or_else(|_| "Invalid JSON".to_string())
    //             }
    //             Object::Stream(ref stream) => {
    //                 // Handling stream, customize as needed
    //                 log::debug!("Stream Data: {:?}", stream);
    //                 "Stream Data".to_string()
    //             }
    //             _ => "Unknown Type".to_string(),
    //         };
    //         map.insert(key_str, value_str);
    //     }
    //     map
    // }

    fn get_document_metadata(&self, document: &Document) -> HashMap<String, String> {
        let mut metadata = HashMap::new();
        if let Some(ref info) = get_info(&document) {
            for (k, v) in *info {
                match v {
                    &Object::String(ref s, StringFormat::Literal) => {
                        metadata.insert(pdf_to_utf8(k), pdf_to_utf8(s));
                    }
                    _ => {}
                }
            }
        }
        return metadata;
    }
    
    // fn split_pdf_into_seperate_pages(&self, doc: &Document){
    //     for (index, page_id) in doc.page_iter().enumerate() {
    //         let page = doc.get_object_page(page_id).unwrap();
    //         let mut new_doc = Document::with_version("1.5");
    //         new_doc.
    //         new_doc.renumber_objects();
    //         new_doc.prune_objects();
    // 
    //         let output_path = format!("output_page_{}.pdf", index + 1);
    //         new_doc.save(&output_path)?;
    //         println!("Saved: {}", output_path);
    //     }
    //     
    // }
    
    pub fn extract_text_from_pdf(&self, path: String) -> Result<Vec<(String, HashMap<String, String>)>> {
        let mut res: Vec<(String, HashMap<String, String>)> = vec![];
        let mut page_text = String::new();
        match Document::load(path) {
            Ok(doc) => {
                let pages = get_pages(&doc);
                let mut page_number = 0;
                let mut metadata = self.get_document_metadata(&doc);
                if let Some(font) = self.detect_pdf_fonts(&doc) {
                    for (k, v) in font {
                        metadata.insert(k, v);
                    }
                }
                let pages = doc.get_pages();
                for (page_number, page) in pages {
                    println!("page_number: {}", page_number);
                    match Document::get_page_content(&doc, page) {
                        Ok(p) => {
                            // page_text = pdf_to_utf8(&*p);
                            match String::from_utf8(p){
                                
                                println!("Page text: {}", p);
                                metadata.insert("page_number".to_string(), format!("{}", page_number).to_string());
                                metadata.insert("text".to_string(), page_text.clone());
                                res.push((page_text, metadata.clone()))
                            }
                        }
                        Err(e) => log::error!("could not extract text from PDF. Error: {}", e),
                    }
                }
                Ok(res)
            }
            Err(e) => Err(anyhow!("Could not load PDF from file. Error: {}", e)),
        }
    }

    // pub fn extract_text_from_pdf_old(&self, path: String) -> Result<(String, HashMap<String, String>)> {
    //     match lopdf::Document::load(path.as_str()) {
    //         Ok(doc) => {
    //             let mut metadata = self.detect_pdf_fonts(&doc);
    //             let mut res = (String::new(), metadata);
    //             let pages = doc.get_pages();
    //             if let Some((x, page)) = pages.into_iter().next() {
    //                 return match extract_text(path.as_str()) {
    //                     Ok(text) => {
    //                         if text.is_empty() {
    //                             return Err(anyhow!(
    //                                 "Unable to extract text from PDF document: {}",
    //                                 path
    //                             ));
    //                         }
    //                         res = (text, metadata.clone());
    //                         Ok(res)
    //                     }
    //                     Err(e) => Err(anyhow!(
    //                         "An error occurred while trying to extract text from pdf. Error: {}",
    //                         e
    //                     )),
    //                 };
    //             }
    //             Ok(res)
    //         }
    //         Err(e) => Err(anyhow!(
    //             "An error occurred while attempting to load PDF doc: {}",
    //             e
    //         )),
    //     }
    // }

    // this method covers docx, xlsx and pptx
    pub fn extract_text_from_docx(&self, path: String) -> Result<Vec<(String, HashMap<String, String>)>> {
        let mut res: Vec<(String, HashMap<String, String>)> = vec![];
        let metadata = HashMap::new();
        let mut docx = String::new();
        let mut file = Docx::open(path.as_str()).expect("Cannot open file");
        file.read_to_string(&mut docx).unwrap();
        res.push((docx, metadata));
        Ok(res)
    }
    pub fn extract_text_from_txt(&self, path: String) -> Result<Vec<(String, HashMap<String, String>)>> {
        let mut res: Vec<(String, HashMap<String, String>)> = vec![];
        let metadata = HashMap::new();
        let mut text = String::new();
        match fs::read_to_string(path) {
            Ok(t) => text = t,
            Err(e) => {
                return Err(anyhow!("Could  not read file. Error: {}", e));
            }
        }
        res.push((text, metadata));
        Ok(res)
    }

    pub fn detect_pdf_fonts(&self, doc: &Document) -> Option<HashMap<String, String>> {
        let mut metadata = HashMap::new();
        // Iterate over all pages
        for page_id in doc.page_iter() {
            let (resources, _) = doc.get_page_resources(page_id);
            return match resources {
                Some(r) => {
                    let fonts = r.get(b"Font").unwrap().as_dict().unwrap();
                    // Iterate over fonts in the resources
                    for (_, font_dict) in fonts {
                        let font_dict = font_dict.as_reference().unwrap();
                        let font_obj = doc.get_object(font_dict).unwrap();
                        if let Object::Dictionary(dict) = font_obj {
                            // Extract font name and encoding
                            let base_font = dict.get(b"BaseFont").unwrap().as_name_str().unwrap();
                            let encoding = dict
                                .get(b"Encoding")
                                .map_or("Unknown", |e| e.as_name_str().unwrap());

                            metadata.insert(base_font.to_string(), encoding.to_string());
                        }
                    }
                    Some(metadata)
                }
                None => None
            };
        }
        return None;
    }
    pub async fn extract_text_from_csv(
        &self,
        path: String,
        datasource_id: String,
        queue: Arc<RwLock<Pool<String>>>,
        qdrant_conn: Arc<RwLock<QdrantClient>>,
        mongo_conn: Arc<RwLock<Database>>,
        // redis_conn_pool: Arc<Mutex<RedisConnection>>,
    ) {
        match csv::Reader::from_path(path) {
            Ok(mut rdr) => {
                for row in rdr.records() {
                    match row {
                        Ok(record) => {
                            let string_record = record.iter().collect::<Vec<&str>>().join(", ");
                            let queue = Arc::clone(&queue);
                            let qdrant_conn = Arc::clone(&qdrant_conn);
                            let mongo_conn = Arc::clone(&mongo_conn);
                            let ds_clone = datasource_id.clone();
                            add_message_to_embedding_queue(queue, qdrant_conn, mongo_conn, (ds_clone, string_record)).await;
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
