use ndarray::Array1;
use std::collections::HashMap;
use std::fs;
use std::sync::Arc;
use actix_web::dev::ResourcePath;
use anyhow::anyhow;
use mongodb::Database;
use qdrant_client::client::QdrantClient;
use tokio::sync::RwLock;
use crate::data::text_extraction::TextExtraction;
use crate::data::models::{Document as DocumentModel, Document, FileType, Sentence};
use crate::data::text_splitting::TextSplitting;
use crate::llm::models::EmbeddingModels;
use crate::mongo::models::ChunkingStrategy;
use crate::queue::queuing::Pool;

pub fn calculate_cosine_distances(sentences: &mut Vec<Sentence>) -> Vec<f32> {
    let mut distances = Vec::new();
    log::debug!("Sentence Length: {}", sentences.len());
    let mut distance = 1.0;
    if sentences.len() > 1 {
        for i in 0..sentences.len() - 1 {
            let embedding_current = &sentences[i].sentence_embedding;
            let embedding_next = &sentences[i + 1].sentence_embedding;
            log::debug!("Embedding  next: {}", embedding_next);
            // Calculate cosine similarity
            let similarity = cosine_similarity(embedding_current, embedding_next);
            log::debug!("Similarity Score: {}", similarity);
            // Convert to cosine distance
            distance = 1.0 - similarity;

            // Append cosine distance to the list
            distances.push(distance);

            // Store distance in the struct
            sentences[i].distance_to_next = Some(distance);
        }

        // Optionally handle the last sentence
        sentences.last_mut().unwrap().distance_to_next = None; // or a default value
    } else {
        distances.push(distance)
    }
    distances
}

pub fn cosine_similarity(a: &Array1<f32>, b: &Array1<f32>) -> f32 {
    let dot_product = a.dot(b);
    let norm_a = a.dot(a).sqrt();
    let norm_b = b.dot(b).sqrt();
    dot_product / (norm_a * norm_b)
}

pub fn percentile(values: &Vec<f32>, percentile: usize) -> f32 {
    assert!(!values.is_empty(), "Values cannot be empty");
    assert!(percentile <= 100, "Percentile must be between 0 and 100");

    let mut sorted_values = values.to_vec();
    sorted_values.sort_by(|a, b| a.partial_cmp(b).unwrap());

    let k = (percentile as f64 / 100.0 * (values.len() as f64 - 1.0)).round() as usize;
    sorted_values[k]
}

pub async fn extract_text_from_file(
    file_type: FileType,
    file_path: &str,
    document_name: String,
    datasource_id: String,
    queue: Arc<RwLock<Pool<String>>>,
    qdrant_conn: Arc<RwLock<QdrantClient>>,
    mongo_conn: Arc<RwLock<Database>>,
    // redis_conn_pool: Arc<Mutex<RedisConnection>>,
) -> Option<(String, Option<HashMap<String, String>>)> {
    let mut document_text = String::new();
    let mut metadata = HashMap::new();
    let path = file_path.trim_matches('"').path().to_string();
    let chunker = TextExtraction::default();
    match file_type {
        FileType::PDF => {
            let path_clone = path.clone();
            (document_text, metadata) = chunker
                .extract_text_from_pdf(path_clone)
                .expect("Could not extract text from PDF file");
        }
        FileType::TXT => {
            let path_clone = path.clone();
            (document_text, metadata) = chunker
                .extract_text_from_txt(path_clone)
                .expect("Could not extract text from TXT file");
        }
        FileType::DOCX => {
            let path_clone = path.clone();
            (document_text, metadata) = chunker
                .extract_text_from_docx(path_clone)
                .expect("Could not extract text from DOCX file");
        }
        FileType::CSV => return {
            let path_clone = path.clone();
            _ = chunker.extract_text_from_csv(
                path_clone,
                datasource_id,
                queue,
                qdrant_conn,
                mongo_conn,
                // redis_conn_pool,
            );
            None
        },
        FileType::UNKNOWN => return None,
    }
    // Once we have extracted the text from the file we no longer need the file and there file we delete from disk
    let path_clone = path.clone();
    match fs::remove_file(path_clone) {
        Ok(_) => log::debug!("File: {:?} successfully deleted", file_path),
        Err(e) => log::error!(
            "An error occurred while trying to delete file: {}. Error: {:?}",
            file_path, e
        ),
    }
    metadata.insert(String::from("document name"), document_name);
    let results = (document_text, Some(metadata));
    Some(results)
}

pub async fn apply_chunking_strategy_to_document(
    document_text: String,
    metadata: Option<HashMap<String, String>>,
    chunking_strategy: ChunkingStrategy,
    chunking_character: Option<String>,
    embedding_models: Option<String>,
    mongo_conn: Arc<RwLock<Database>>,
    datasource_id: String,
) -> anyhow::Result<Vec<DocumentModel>> {
    let embedding_model_choice = EmbeddingModels::from(embedding_models.unwrap());
    let splitter = TextSplitting::new(
        embedding_model_choice,
        true,
        Some(chunking_strategy),
        chunking_character,
        mongo_conn,
        datasource_id,
    );
    let doc = Document {
        page_content: document_text,
        metadata,
        embedding_vector: None,
    };
    let Ok(results) = splitter.split_documents(vec![doc]).await else {
        return Err(anyhow!("Chunker returned an empty document!"));
    };
    Ok(results)
}
