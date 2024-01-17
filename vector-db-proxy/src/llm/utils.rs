use anyhow::Result;
use async_openai::types::CreateEmbeddingRequestArgs;
use qdrant_client::client::QdrantClient;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::qdrant::helpers::reverse_embed_payload;
use crate::qdrant::utils::Qdrant;
use crate::routes::models::FilterConditions;
use llm_chain::{chains::conversation::Chain, executor, parameters, prompt, step::Step};

pub struct LLM {}

impl LLM {
    pub fn new() -> Self {
        LLM {}
    }

    ///
    ///
    /// # Arguments
    ///
    /// * `text`:
    ///
    /// returns: Result<Vec<Vec<f32, Global>, Global>, Error>
    ///
    /// # Examples
    ///
    /// ```
    ///
    /// ```
    pub async fn embed_text(&self, text: Vec<String>) -> Result<Vec<Vec<f32>>> {
        println!("Embedding...");
        let backoff = backoff::ExponentialBackoffBuilder::new()
            .with_max_elapsed_time(Some(std::time::Duration::from_secs(60)))
            .build();
        let client = async_openai::Client::new().with_backoff(backoff);
        let request = CreateEmbeddingRequestArgs::default()
            .model("text-embedding-ada-002")
            .input(text)
            .build()?;
        let response = client.embeddings().create(request).await?;
        let embedding: Vec<Vec<f32>> = response
            .data
            .iter()
            .map(|data| data.clone().embedding)
            .collect();
        Ok(embedding)
    }

    ///
    ///
    /// # Arguments
    ///
    /// * `qdrant_conn`:
    /// * `dataset_id`:
    /// * `text`:
    /// * `filters`:
    /// * `limit`:
    ///
    /// returns: Result<String, Error>
    ///
    /// # Examples
    ///
    /// ```
    ///
    /// ```
    pub async fn get_prompt_response(
        &self,
        qdrant_conn: Arc<RwLock<QdrantClient>>,
        dataset_id: String,
        text: Vec<String>,
        filters: Option<FilterConditions>,
        limit: Option<u64>,
    ) -> Result<String> {
        let prompt = text.to_vec();
        let prompt_embedding = &self.embed_text(prompt.to_vec()).await?;
        let qdrant = Qdrant::new(qdrant_conn, dataset_id);

        let qdrant_search_results = qdrant
            .return_similar_results(prompt_embedding[0].to_vec(), filters, limit)
            .await?;
        let mut list_of_system_prompts: Vec<Vec<String>> = vec![];
        for results in qdrant_search_results {
            let system_prompts = reverse_embed_payload(&results.payload).await?;
            list_of_system_prompts.push(system_prompts.to_owned());
        }
        // Data coming from external systems should be a system message
        let executor = executor!(chatgpt)?;
        let data = list_of_system_prompts[0].join(", ");

        let step_1 = Step::for_prompt_template(
            prompt!(system: "I will provide you with data that you can use to answer the user's questions"),
        );
        let step_2 = Step::for_prompt_template(prompt!(system: data.as_str()));

        let mut chain = Chain::new(prompt!(system: "You are a helpful assistant that answers questions users questions using the data provided to you. If you do not know the answer or the data you have does not provide the information to answer the question say i do not know, do not try to make up an answer.")).unwrap();

        // Execute the conversation steps.
        let res_1 = chain
            .send_message(step_1, &parameters!(), &executor)
            .await?;
        let res = chain
            .send_message(step_2, &parameters!(), &executor)
            .await?;
        let chat_res = res.to_immediate().await?.as_content().to_text();
        Ok(chat_res)
    }
}
