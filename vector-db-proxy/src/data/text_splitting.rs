use crate::data::models::{Document, Sentence};
use crate::data::utils::percentile;
use crate::llm::utils::embed_text;
use crate::llm::{models::EmbeddingModels, utils::embed_text_chunks_async};
use crate::mongo::models::ChunkingStrategy;
use anyhow::{anyhow, Result};
use ndarray::Array1;
use std::collections::HashMap;
use std::sync::Arc;
use mongodb::Database;
use tokio::sync::RwLock;
use crate::data::utils;

pub struct TextSplitting {
    embedding_model: EmbeddingModels,
    add_start_index: bool,
    chunking_strategy: Option<ChunkingStrategy>,
    chunking_character: Option<String>,
    mongo_conn: Arc<RwLock<Database>>,
    datasource_id: String,
}

impl TextSplitting {
    pub fn new(
        embedding_model: EmbeddingModels,
        add_start_index: bool,
        chunking_strategy: Option<ChunkingStrategy>,
        chunking_character: Option<String>,
        mongo_conn: Arc<RwLock<Database>>,
        datasource_id: String,
    ) -> Self {
        TextSplitting {
            embedding_model,
            add_start_index,
            chunking_strategy,
            chunking_character,
            mongo_conn,
            datasource_id,
        }
    }

    async fn form_sentences(&self, text: &str) -> Vec<HashMap<String, String>> {
        let mut sentence_list: Vec<&str> = vec![];
        match &self.chunking_strategy.as_ref().unwrap() {
            ChunkingStrategy::SEMANTIC_CHUNKING => {
                sentence_list = text.split(&['.', '?', '!']).collect();
            }
            ChunkingStrategy::CHARACTER_CHUNKING => {
                sentence_list = text
                    .split(&self.chunking_character.as_ref().unwrap().as_str())
                    .collect();
            }
            _ => {}
        }
        let sentences: Vec<HashMap<String, String>> = sentence_list
            .iter()
            .enumerate()
            .map(|(i, &sentence)| {
                let mut sentence_map = HashMap::new();
                sentence_map.insert("sentence".to_string(), sentence.to_string());
                sentence_map.insert("index".to_string(), i.to_string());
                sentence_map
            })
            .collect();
        sentences
    }

    ///This is the main function that splits documents into the correct chunks
    /// based on the chosen chunking strategy
    ///This function accepts a string slice (&str) and returns a Vector of `Documents`
    /// ```rust
    /// Document {
    ///     page_content: String,
    ///     metadata: Option<HashMap<String, String>>,
    ///     embedding_vector: Option<Vec<f32>>
    ///  }
    /// ```
    /// At the moment this function support only 2 chunking strategies
    /// 1. Character Chunking: Loops document and splits based on a user-defined character
    /// 2. Semantic Chunking: This method aims to combine semantically similar sentences to form a chunk that represents a cohesive 'idea'
    async fn split_text(&self, text: &str) -> Option<Vec<Document>> {
        // here we instantiate all the vectors that we will use later on
        let mut chunks = Vec::new();
        let mut vector_of_sentences: Vec<Sentence> = vec![];
        if !text.is_empty() {
            // we slice our text into sentences based on the chunking strategy that we are using
            let sentences = &self.form_sentences(text).await;
            // from those sentence hashmaps we extract the text and form a vector of strings which contain each sentence.
            let list_of_text: Vec<String> =
                sentences.iter().map(|s| s["sentence"].clone()).collect();

            // we embed each of those sentences
            let mongo_conn_clone = Arc::clone(&self.mongo_conn);
            let datasource_id_clone = self.datasource_id.clone();
            // todo: replace this with the embed queue
            match embed_text_chunks_async(mongo_conn_clone, datasource_id_clone, list_of_text, self.embedding_model).await {
                Ok(embeddings) => {
                    // we match the index with the embedding index and insert the embedding vector into the sentence hashmap
                    for (i, sentence) in sentences.iter().enumerate() {
                        if !embeddings.is_empty() && embeddings.len() > 0 {
                            if i < embeddings.len() && !embeddings[i].is_empty() {
                                vector_of_sentences.push(Sentence {
                                    sentence_embedding: Array1::from_vec(embeddings[i].clone()),
                                    distance_to_next: None,
                                    sentence: Some(sentence["sentence"].clone()),
                                });
                            }
                        }
                    }
                    // here is where the divergence occurs depending on the chunking strategy chosen by the use
                    match &self.chunking_strategy.as_ref().unwrap() {
                        ChunkingStrategy::SEMANTIC_CHUNKING => {
                            // in the semantic chunking we iterate through each of the sentences and calculate their relative cosine similarity scores
                            let distances = utils::calculate_cosine_distances(&mut vector_of_sentences);
                            let breakpoint_percentile_threshold = 95;
                            let breakpoint_distance_threshold =
                                percentile(&distances, breakpoint_percentile_threshold);

                            // Initialize accumulators for indices above and below the threshold
                            let (indices_above_thresh, indices_below_threshold): (Vec<usize>, Vec<usize>) =
                                distances
                                    .iter()
                                    .enumerate()
                                    // Use fold to iterate once, separating indices based on the threshold
                                    .fold((vec![], vec![]), |(mut above, mut below), (i, &d)| {
                                        if d >= breakpoint_distance_threshold {
                                            above.push(i);
                                        } else if d < breakpoint_distance_threshold {
                                            below.push(i);
                                        }
                                        (above, below)
                                    });

                            log::debug!("Indices above threshold:  {:?}", &indices_above_thresh);

                            let mut start_index = 0;
                            for &index in &indices_above_thresh {
                                // Ensure the current index has not already been processed
                                if index >= start_index {
                                    // Create a chunk from start_index up to the current index
                                    let group = &sentences[start_index..=index];
                                    let combined_text = group
                                        .iter()
                                        .map(|d| d["sentence"].as_str())
                                        .collect::<Vec<&str>>()
                                        .join(". ");
                                    // embed the new combined text and insert into document
                                    let mongo_conn_clone = Arc::clone(&self.mongo_conn);
                                    let datasource_id_clone = self.datasource_id.clone();
                                    // todo: rather than push to chunks what we can do here is called `add_message_to_embedding_queue`
                                    let new_embedding =
                                        embed_text(mongo_conn_clone, datasource_id_clone, vec![&combined_text], &self.embedding_model)
                                            .await
                                            .unwrap();
                                    let doc = Document::new(
                                        combined_text,
                                        None,
                                        Some(new_embedding[0].to_owned()),
                                    );
                                    chunks.push(doc);

                                    // Update start_index to the next sentence after the current chunk
                                    start_index = index + 1;
                                }
                            }

                            // Ensure any remaining sentences are captured in a final chunk
                            for sent in indices_below_threshold {
                                let doc = Document::new(
                                    sentences[sent]["sentence"].to_string(),
                                    None,
                                    Some(embeddings[sent].to_owned()),
                                );
                                chunks.push(doc);
                            }
                        }
                        ChunkingStrategy::CHARACTER_CHUNKING => {
                            for sentence in vector_of_sentences {
                                chunks.push(Document::new(
                                    sentence.sentence.unwrap(),
                                    None,
                                    Some(sentence.sentence_embedding.to_vec()),
                                ))
                            }
                        }
                        _ => {}
                    }
                }
                Err(e) => { log::error!("An error occurred while trying to embed text chunk. Error: {}", e); }
            }
            Some(chunks)
        } else {
            None
        }
    }

    async fn chunk_text(
        &self,
        texts: Vec<String>,
        metadata: Vec<Option<HashMap<String, String>>>,
    ) -> Vec<Document> {
        let mut documents = Vec::new();
        for (i, text) in texts.into_iter().enumerate() {
            let mut index: Option<usize> = None;
            // Here is where we call split text
            if let Some(chunks) = self.split_text(&text).await {
                for mut chunk in chunks {
                    let mut metadata = metadata[i].clone().unwrap();
                    if self.add_start_index {
                        // Use char_indices to work with character boundaries
                        let text_chars: Vec<(usize, char)> = text.char_indices().collect();
                        index = match index {
                            Some(idx) => {
                                // Find the chunk's start position relative to idx, ensuring we're within character boundaries
                                text_chars.iter().skip(idx + 1).position(|(_, c)| chunk.page_content.starts_with(*c)).map(|pos| text_chars[idx + 1 + pos].0)
                            }
                            None => {
                                // Find the first occurrence of the chunk.page_content, still ensuring we're within character boundaries
                                text_chars.iter().find(|(_, c)| chunk.page_content.starts_with(*c)).map(|&(pos, _)| pos)
                            }
                        };
                        if let Some(idx) = index {
                            metadata.insert("start_index".to_string(), idx.to_string());
                        }
                    }
                    metadata.insert("page_content".to_string(), chunk.page_content.to_string());
                    chunk.metadata = Some(metadata);
                    documents.push(chunk);
                }
            }
        }
        documents
    }


    /// takes a `Vec<Document>` as an input and returns a `Result<Vec<Document>` as output
    /// collect `text` and `metadata` from each document and calls `create_document` method
    pub async fn split_documents(&self, documents: Vec<Document>) -> Result<Vec<Document>> {
        let (texts, metadata): (Vec<_>, Vec<_>) = documents
            .into_iter()
            .map(|doc| (doc.page_content, doc.metadata))
            .unzip();
        // `create_document()` calls `split_text()` which actually applies the chunking strategy
        let results = self.chunk_text(texts, metadata).await;
        if !results.is_empty() {
            Ok(results)
        } else {
            Err(anyhow!("Split document returned an empty list"))
        }
    }
}
