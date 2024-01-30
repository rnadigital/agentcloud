use crate::data::models::Document;
use crate::data::utils::{cosine_similarity, percentile};
use crate::llm::utils::{EmbeddingModels, LLM};
use actix_web_lab::__reexports::futures_util::stream::FuturesUnordered;
use actix_web_lab::__reexports::futures_util::StreamExt;
use anyhow::{anyhow, Result};
use ndarray::Array1;
use std::collections::HashMap;

// `Sentence` is a struct that holds the embedding and other metadata
#[derive(Clone, Debug)]
struct Sentence {
    combined_sentence_embedding: Array1<f32>,
    distance_to_next: Option<f32>,
}
impl Default for Sentence {
    fn default() -> Self {
        Sentence {
            combined_sentence_embedding: Array1::from_vec(vec![]),
            distance_to_next: None,
        }
    }
}

fn calculate_cosine_distances(sentences: &mut Vec<Sentence>) -> Vec<f32> {
    let mut distances = Vec::new();

    for i in 0..sentences.len() - 1 {
        let embedding_current = &sentences[i].combined_sentence_embedding;
        let embedding_next = &sentences[i + 1].combined_sentence_embedding;

        // Calculate cosine similarity
        let similarity = cosine_similarity(embedding_current, embedding_next);

        // Convert to cosine distance
        let distance = 1.0 - similarity;

        // Append cosine distance to the list
        distances.push(distance);

        // Store distance in the struct
        sentences[i].distance_to_next = Some(distance);
    }

    // Optionally handle the last sentence
    sentences.last_mut().unwrap().distance_to_next = None; // or a default value

    distances
}

pub struct EmbeddingModel;

impl EmbeddingModel {
    async fn oai_embedding(&self, text: Vec<String>) -> Result<Vec<Vec<f32>>> {
        let llm = LLM::new();
        let embedding = llm.embed_text(text, EmbeddingModels::OAI).await.unwrap();
        Ok(embedding)
    }
}

pub struct SemanticChunker {
    embeddings: EmbeddingModel,
    add_start_index: bool,
}

impl SemanticChunker {
    pub fn new(embeddings: EmbeddingModel, add_start_index: bool) -> Self {
        SemanticChunker {
            embeddings,
            add_start_index,
        }
    }
    pub fn default() -> Self {
        SemanticChunker {
            embeddings: EmbeddingModel,
            add_start_index: true,
        }
    }

    pub async fn embed_chunks_async(
        &self,
        table_chunks: &Vec<HashMap<String, String>>,
    ) -> Vec<Vec<f32>> {
        let mut list_of_embeddings: Vec<Vec<f32>> = vec![];
        let mut futures = FuturesUnordered::new();
        // Within each thread each chunk is processed async by the function `embed_custom_variable_row`
        for row in table_chunks.iter() {
            futures.push(async move {
                let embed_result = self
                    .embeddings
                    .oai_embedding(vec![row["sentence"].clone()])
                    .await;
                return match embed_result {
                    Ok(point) => Ok(point[0].clone()),
                    Err(e) => Err(anyhow!("Embedding row failed: {}", e)),
                };
            });
        }
        while let Some(result) = futures.next().await {
            match result {
                Ok(point) => list_of_embeddings.push(point),
                Err(err) => eprintln!("Err embedding text: {}", err),
            }
        }
        list_of_embeddings
    }

    async fn split_text(&self, text: &str) -> Vec<Document> {
        let single_sentences_list: Vec<&str> = text.split(&['.', '?', '!'][..]).collect();
        let mut sent: Vec<Sentence> = vec![];
        let mut sentences: Vec<HashMap<String, String>> = single_sentences_list
            .iter()
            .enumerate()
            .map(|(i, &sentence)| {
                let mut sentence_map = HashMap::new();
                sentence_map.insert("sentence".to_string(), sentence.to_string());
                sentence_map.insert("index".to_string(), i.to_string());
                sentence_map
            })
            .collect();

        let embeddings = self.embed_chunks_async(&sentences).await;

        for (i, sentence) in sentences.iter_mut().enumerate() {
            sentence.insert(
                "sentence_embedding".to_string(),
                format!("{:?}", embeddings[i]),
            );
            sent.push(Sentence {
                combined_sentence_embedding: Array1::from_vec(embeddings[i].clone()),
                distance_to_next: None,
            });
        }

        let distances = calculate_cosine_distances(&mut sent);
        let mut chunks = Vec::new();
        let breakpoint_percentile_threshold = 95;
        let breakpoint_distance_threshold = percentile(&distances, breakpoint_percentile_threshold);

        let indices_above_thresh: Vec<usize> = distances
            .iter()
            .enumerate()
            .filter_map(|(i, &d)| {
                if d > breakpoint_distance_threshold {
                    Some(i)
                } else {
                    None
                }
            })
            .collect();
        let mut start_index = 0;
        for index in indices_above_thresh {
            let group = &sentences[start_index..=index];
            let combined_text = group
                .iter()
                .map(|d| d["sentence"].as_str())
                .collect::<Vec<&str>>()
                .join(". ");
            let doc = Document::new(combined_text, None, Some(embeddings[index].to_owned()));
            chunks.push(doc);
            start_index = index + 1;
        }

        if start_index < sentences.len() {
            let combined_text = sentences[start_index..]
                .iter()
                .map(|d| d["sentence"].as_str())
                .collect::<Vec<&str>>()
                .join(" ");
            let doc = Document::new(combined_text, None, None);
            chunks.push(doc);
        }

        chunks
    }

    async fn create_documents(
        &self,
        texts: Vec<String>,
        metadata: Vec<Option<HashMap<String, String>>>,
    ) -> Vec<Document> {
        let mut documents = Vec::new();
        for (i, text) in texts.into_iter().enumerate() {
            let mut index: Option<usize> = None;
            for mut chunk in self.split_text(&text).await {
                let mut metadata = metadata[i].clone().unwrap();
                if self.add_start_index {
                    index = match index {
                        Some(idx) => text[idx + 1..]
                            .find(&chunk.page_content)
                            .map(|found_idx| found_idx + idx + 1),
                        None => text.find(&chunk.page_content),
                    };
                    if let Some(idx) = index {
                        metadata.insert("start_index".to_string(), idx.to_string());
                    }
                }
                chunk.metadata = Some(metadata);
                documents.push(chunk);
            }
        }
        documents
    }

    pub async fn split_documents(&self, documents: Vec<Document>) -> Result<Vec<Document>> {
        let (texts, metadata): (Vec<_>, Vec<_>) = documents
            .into_iter()
            .map(|doc| (doc.page_content, doc.metadata))
            .unzip();
        Ok(self.create_documents(texts, metadata).await)
    }
}
