use anyhow::{anyhow, Result};
use async_openai::types::CreateEmbeddingRequestArgs;
use fastembed::{EmbeddingBase, FlagEmbedding, InitOptions};
use llm_chain::{chains::conversation::Chain, executor, parameters, prompt, step::Step};
use qdrant_client::client::QdrantClient;
use std::sync::Arc as arc;
use std::sync::Arc;
use ort::{CoreMLExecutionProvider, ExecutionProvider, ExecutionProviderDispatch};
use tokio::sync::mpsc;
use tokio::sync::RwLock;
use tokio::task;

use crate::llm::models::{EmbeddingModels, FastEmbedModels};
use crate::qdrant::helpers::reverse_embed_payload;
use crate::qdrant::utils::Qdrant;
use crate::routes::models::FilterConditions;

pub async fn embed_text(text: Vec<&String>, model: &EmbeddingModels) -> Result<Vec<Vec<f32>>> {
    match model {
        EmbeddingModels::UNKNOWN => Err(anyhow!("This is an unknown model type!")),
        // Group all fast embed models together
        EmbeddingModels::BAAI_BGE_SMALL_EN
        | EmbeddingModels::BAAI_BGE_SMALL_EN_V1_5
        | EmbeddingModels::BAAI_BGE_BASE_EN
        | EmbeddingModels::BAAI_BGE_BASE_EN_V1_5
        | EmbeddingModels::ENTENCE_TRANSFORMERS_ALL_MINILM_L6_V2
        | EmbeddingModels::XENOVA_FAST_MULTILINGUAL_E5_LARGE => match model.to_str() {
            Some(m) => {
                let coreml = CoreMLExecutionProvider::default();
                if !coreml.is_available().unwrap() {
                    eprintln!("Please compile ONNX Runtime with CoreML!");
                    std::process::exit(1);
                }
                let model = FastEmbedModels::from(m.to_string());
                match FastEmbedModels::translate(&model) {
                    Some(translation) => {
                        let model: FlagEmbedding = FlagEmbedding::try_new(InitOptions {
                            model_name: translation,
                            show_download_message: true,
                            execution_providers: vec![ExecutionProviderDispatch::CoreML(coreml)],
                            ..Default::default()
                        })?;
                        let embeddings = model.passage_embed(text, None)?;
                        Ok(embeddings)
                    }
                    None => Err(anyhow!(
                        "Model does not match any known fast embed model variants"
                    )),
                }
            }
            None => Err(anyhow!("Model type unknown")),
        },

        // Group all OAI models
        _ => match model.to_str() {
            Some(m) => {
                let backoff = backoff::ExponentialBackoffBuilder::new()
                    .with_max_elapsed_time(Some(std::time::Duration::from_secs(60)))
                    .build();
                let client = async_openai::Client::new().with_backoff(backoff);
                let request = CreateEmbeddingRequestArgs::default()
                    .model(m)
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
            None => Err(anyhow!("Model type is unknown")),
        },
    }
}

pub struct LLM;

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

    pub async fn embed_text_chunks_async(
        &self,
        table_chunks: Vec<String>,
        model: EmbeddingModels,
    ) -> Result<Vec<Vec<f32>>> {
        let mut list_of_embeddings: Vec<Vec<f32>> = vec![];

        let (tx, mut rx) = mpsc::channel(table_chunks.len()); // Channel with enough capacity

        for item in table_chunks {
            let tx = tx.clone(); // Clone the transmitter for each task
            let item = arc::new(item); // Use Arc to share ownership across tasks, avoiding cloning large data

            task::spawn(async move {
                let processed_item = embed_text(vec![&item], &model).await; // Process item asynchronously
                tx.send(processed_item)
                    .await
                    .expect("Failed to send processed item"); // Send back the result
            });
        }

        // Drop the original transmitter so the receiver knows when all tasks are done
        drop(tx);

        // Collect the results
        while let Some(processed_item) = rx.recv().await {
            if let Ok(embed) = processed_item {
                list_of_embeddings.push(embed[0].clone())
            }
        }

        Ok(list_of_embeddings)
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
        text: Vec<&String>,
        filters: Option<FilterConditions>,
        limit: Option<u64>,
    ) -> Result<String> {
        let prompt = text.to_vec();
        let prompt_embedding = embed_text(prompt, &EmbeddingModels::OAI_ADA).await?;
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
        println!("Data: {:?}", data);
        let step_1 = Step::for_prompt_template(
            prompt!(system: "I will provide you with data that you can use to answer the user's questions"),
        );
        let step_2 = Step::for_prompt_template(prompt!(system: data.as_str()));

        let mut chain = Chain::new(prompt!(system: "You are a helpful assistant that answers questions users questions using the data provided to you. If you do not know the answer or the data you have does not provide the information to answer the question say i do not know, do not try to make up an answer.")).unwrap();

        // Execute the conversation steps.
        let _ = chain
            .send_message(step_1, &parameters!(), &executor)
            .await?;
        let res = chain
            .send_message(step_2, &parameters!(), &executor)
            .await?;
        let chat_res = res.to_immediate().await?.as_content().to_text();
        Ok(chat_res)
    }
}
