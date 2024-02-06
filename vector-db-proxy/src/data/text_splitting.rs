use crate::data::models::Document;
use crate::data::utils::{cosine_similarity, percentile};
use crate::llm::utils::{EmbeddingModels, LLM};
use crate::mongo::models::ChunkingStrategy;
use anyhow::Result;
use ndarray::Array1;
use std::collections::HashMap;

// `Sentence` is a struct that holds the embedding and other metadata
#[derive(Clone, Debug)]
struct Sentence {
    sentence_embedding: Array1<f32>,
    distance_to_next: Option<f32>,
    sentence: Option<String>,
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

fn calculate_cosine_distances(sentences: &mut Vec<Sentence>) -> Vec<f32> {
    let mut distances = Vec::new();

    for i in 0..sentences.len() - 1 {
        let embedding_current = &sentences[i].sentence_embedding;
        let embedding_next = &sentences[i + 1].sentence_embedding;

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

pub struct Chunker {
    embeddings: EmbeddingModels,
    add_start_index: bool,
    chunking_strategy: Option<ChunkingStrategy>,
    chunking_character: Option<String>,
}

impl Chunker {
    pub fn new(
        embeddings: EmbeddingModels,
        add_start_index: bool,
        chunking_strategy: Option<ChunkingStrategy>,
        chunking_character: Option<String>,
    ) -> Self {
        Chunker {
            embeddings,
            add_start_index,
            chunking_strategy,
            chunking_character,
        }
    }
    pub fn default() -> Self {
        Chunker {
            embeddings: EmbeddingModels::OAI,
            add_start_index: true,
            chunking_strategy: Some(ChunkingStrategy::SEMANTIC_CHUNKING),
            chunking_character: Some(String::from(".")),
        }
    }

    async fn form_sentences(&self, text: &str) -> Vec<HashMap<String, String>> {
        let mut sentence_list: Vec<&str> = vec![];
        match &self.chunking_strategy.as_ref().unwrap() {
            ChunkingStrategy::SEMANTIC_CHUNKING => {
                sentence_list = text.split(&['.', '?', '!'][..]).collect();
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

    async fn split_text(&self, text: &str) -> Vec<Document> {
        // here we instantiate all the vectors that we will use later on
        let mut chunks = Vec::new();
        let mut vector_of_sentences: Vec<Sentence> = vec![];
        // we slice our text into sentences based on the chunking strategy that we are using
        let sentences = &self.form_sentences(text).await;
        // from those sentence hashmaps we extract the text and form a vector of strings which contain each sentence.
        let list_of_text: Vec<String> = sentences.iter().map(|s| s["sentence"].clone()).collect();

        // we embed each of those sentences
        let llm = LLM::new();
        match llm
            .embed_text_chunks_async(list_of_text, EmbeddingModels::OAI)
            .await
        {
            Ok(embeddings) => {
                // we match the index with the embedding index and insert the embedding vector into the sentence hashmap
                for (i, sentence) in sentences.iter().enumerate() {
                    vector_of_sentences.push(Sentence {
                        sentence_embedding: Array1::from_vec(embeddings[i].clone()),
                        distance_to_next: None,
                        sentence: Some(sentence["sentence"].clone()),
                    });
                }
                // here is where the divergence occurs depending on the chunking strategy chosen by the use
                match &self.chunking_strategy.as_ref().unwrap() {
                    ChunkingStrategy::SEMANTIC_CHUNKING => {
                        // in the semantic chunking we iterate through each of the sentences and calculate their relative cosine similarity scores
                        let distances = calculate_cosine_distances(&mut vector_of_sentences);
                        let breakpoint_percentile_threshold = 95;
                        let breakpoint_distance_threshold =
                            percentile(&distances, breakpoint_percentile_threshold);

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
                            let doc = Document::new(
                                combined_text,
                                None,
                                Some(embeddings[index].to_owned()),
                            );
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
            Err(e) => {
                println!(
                    "An error occurred while trying to embed text chunk. Error: {}",
                    e
                );
            }
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
                metadata.insert("text".to_string(), chunk.page_content.to_string());
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
