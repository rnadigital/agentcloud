use crate::data::utils::{cosine_similarity, percentile};
use crate::llm::utils::{EmbeddingModels, LLM};
use ndarray::Array1;
use std::collections::HashMap;
use crate::data::models::Document;

fn combine_sentences(
    sentences: Vec<HashMap<String, String>>,
    buffer_size: usize,
) -> Vec<HashMap<String, String>> {
    let mut combined_sentences = Vec::new();

    for (i, sentence) in sentences.iter().enumerate() {
        let mut combined_sentence = String::new();

        for j in i.saturating_sub(buffer_size)..i {
            if let Some(prev_sentence) = sentences.get(j) {
                combined_sentence.push_str(&prev_sentence["sentence"]);
                combined_sentence.push(' ');
            }
        }

        combined_sentence.push_str(&sentence.get("sentence").unwrap());

        for j in i + 1..std::cmp::min(i + 1 + buffer_size, sentences.len()) {
            if let Some(next_sentence) = sentences.get(j) {
                combined_sentence.push(' ');
                combined_sentence.push_str(&next_sentence["sentence"]);
            }
        }

        let mut combined_sentence_map = HashMap::new();
        combined_sentence_map.insert("combined_sentence".to_string(), combined_sentence);
        combined_sentences.push(combined_sentence_map);
    }

    combined_sentences
}

// Assuming `Sentence` is a struct or similar type that holds the embedding and other data
#[derive(Clone)]
struct Sentence {
    combined_sentence_embedding: Array1<f32>,
    distance_to_next: Option<f32>,
}
impl Default for Sentence{
    fn default() -> Self {
        Sentence{
            combined_sentence_embedding: Array1::from_vec(vec![]),
            distance_to_next: None
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

struct Embeddings;

impl Embeddings {
    async fn oai_embedding(&self, docs: Vec<String>) -> Vec<Vec<f32>> {
        let llm = LLM::new();
        let embedding = llm.embed_text(docs, EmbeddingModels::OAI).await.unwrap();
        embedding
    }
}



pub struct SemanticChunker {
    embeddings: Embeddings,
    add_start_index: bool,
}

impl SemanticChunker {
    pub fn new(embeddings: Embeddings, add_start_index: bool) -> Self {
        SemanticChunker {
            embeddings,
            add_start_index,
        }
    }

    async fn split_text(&self, text: &str) -> Vec<String> {
        let single_sentences_list: Vec<&str> = text.split(&['.', '?', '!'][..]).collect();
        let mut sent: Sentence = Sentence::default();
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

        sentences = combine_sentences(sentences, 1);
        let embeddings = self
            .embeddings
            .oai_embedding(
                sentences
                    .iter()
                    .map(|s| s["combined_sentence"].clone())
                    .collect(),
            )
            .await;

        for (i, sentence) in sentences.iter_mut().enumerate() {
            sentence.insert(
                "combined_sentence_embedding".to_string(),
                format!("{:?}", embeddings[i]),
            );
            sent = Sentence{
                combined_sentence_embedding: Array1::from_vec(embeddings[i].clone()),
                distance_to_next: None
            };
        }

        let distances = calculate_cosine_distances(&mut vec![sent]);
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
                .join(" ");
            chunks.push(combined_text);
            start_index = index + 1;
        }

        if start_index < sentences.len() {
            let combined_text = sentences[start_index..]
                .iter()
                .map(|d| d["sentence"].as_str())
                .collect::<Vec<&str>>()
                .join(" ");
            chunks.push(combined_text);
        }

        chunks
    }

    async fn create_documents(
        &self,
        texts: Vec<String>,
        metadata: Option<Vec<HashMap<String, String>>>,
    ) -> Vec<Document> {
        let metadata = metadata.unwrap_or_else(|| vec![HashMap::new(); texts.len()]);
        let mut documents = Vec::new();

        for (i, text) in texts.into_iter().enumerate() {
            let mut index: isize = -1;
            for chunk in self.split_text(&text).await {
                let mut metadata = metadata[i].clone();
                // if self.add_start_index {
                //     index = text[index + 1..].find(&chunk).unwrap_or(-1) + index + 1;
                //     metadata.insert("start_index".to_string(), index.to_string());
                // }
                documents.push(Document::new(chunk, metadata));
            }
        }

        documents
    }

    async fn split_documents(&self, documents: Vec<Document>) -> Vec<Document> {
        let (texts, metadata): (Vec<_>, Vec<_>) = documents
            .into_iter()
            .map(|doc| (doc.page_content, doc.metadata))
            .unzip();
        self.create_documents(texts, Some(metadata)).await
    }

    async fn transform_documents(&self, documents: Vec<Document>) -> Vec<Document> {
        self.split_documents(documents).await
    }
}

// Helper function to calculate percentile
