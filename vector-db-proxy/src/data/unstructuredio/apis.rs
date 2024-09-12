use crate::adaptors::mongo::models::{
    UnstructuredChunkingConfig, UnstructuredChunkingStrategy, UnstructuredPartitioningStrategy,
};
use crate::data::models::FileType;
use crate::data::unstructuredio::models::UnstructuredIOResponse;
use anyhow::{anyhow, Result};
use backoff::backoff::Backoff;
use backoff::ExponentialBackoff;
use reqwest::blocking::multipart::{Form, Part};
use reqwest::blocking::Client;
use reqwest::header::{HeaderMap, HeaderValue};
use std::io::Cursor;
use std::thread::sleep;
use std::time::Duration;

fn chunking_strategy_to_form_data(
    file_buffer: Cursor<Vec<u8>>,
    file_name: Option<String>,
    chunking_strategy: Option<UnstructuredChunkingConfig>,
    file_type: Option<FileType>,
) -> Result<Form> {
    // If there's no file name give we send with a placeholder name and the file extension
    // associated with the file type
    let name = file_name.unwrap_or(format!(
        "text_file.{}",
        FileType::to_str(file_type.unwrap())
    ));
    let mut form = Form::new().part("files", Part::reader(file_buffer).file_name(name));

    if let Some(strategy_config) = chunking_strategy {
        let chunking_strategy = UnstructuredChunkingStrategy::as_str(&strategy_config.strategy);
        if strategy_config.strategy != UnstructuredChunkingStrategy::Basic {
            form = form.text("chunking_strategy", chunking_strategy);
        }
        let max_characters = strategy_config.max_characters.to_string();
        form = form.text("max_characters", max_characters);

        let new_after_n_chars = strategy_config.new_after_n_chars.to_string();
        form = form.text("new_after_n_chars", new_after_n_chars);

        let overlap = strategy_config.overlap.to_string();
        form = form.text("overlap", overlap);

        let overlap_all = strategy_config.overlap_all.to_string();
        form = form.text("overlap_all", overlap_all);

        let partitioning_strategy =
            UnstructuredPartitioningStrategy::as_str(&strategy_config.partitioning);
        form = form.text("strategy", partitioning_strategy);
    }

    if let Some(file_type) = file_type {
        match file_type {
            FileType::PDF => {
                form = form.text("pdf_infer_table_structure", "true");
            }
            _ => (),
        }
    }

    Ok(form)
}

pub fn chunk_text(
    url: String,
    api_key: Option<String>,
    file_buffer: Cursor<Vec<u8>>,
    file_name: Option<String>,
    chunking_strategy: Option<UnstructuredChunkingConfig>,
    file_type: Option<FileType>,
) -> Result<Vec<UnstructuredIOResponse>> {
    let mut backoff = ExponentialBackoff {
        current_interval: Duration::from_millis(50),
        initial_interval: Duration::from_millis(50),
        max_interval: Duration::from_secs(3),
        max_elapsed_time: Some(Duration::from_secs(30)),
        multiplier: 1.5,
        randomization_factor: 0.5,
        ..ExponentialBackoff::default()
    };

    let client = Client::builder()
        .timeout(Duration::from_secs(2000))
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()?;

    let mut header_map = HeaderMap::new();
    header_map.insert("accept", HeaderValue::from_str("application/json")?);

    api_key
        .map(|key| header_map.insert("unstructured-api-key", HeaderValue::from_str(&key).unwrap()));

    loop {
        let form = chunking_strategy_to_form_data(
            file_buffer.clone(),
            file_name.clone(),
            chunking_strategy.clone(),
            file_type,
        )?;
        // Cloning the form for each retry attempt
        let response = client
            .post(&url)
            .headers(header_map.clone())
            .multipart(form)
            .send();

        match response {
            Ok(response_obj) => {
                return if response_obj.status().is_success() {
                    // Deserialize the response if the request was successful
                    match response_obj.json::<Vec<UnstructuredIOResponse>>() {
                        Ok(unstructuredio_response) => Ok(unstructuredio_response),
                        Err(e) => Err(anyhow!(
                            "An error occurred while unpacking the successful response. Error: {:?}",
                            e
                        )),
                    }
                } else {
                    // Handle the error response
                    let status = response_obj.status();
                    let error_text = response_obj.text()?;
                    log::error!(
                        "Received error response with status {}: {}",
                        status,
                        error_text
                    );
                    Err(anyhow!(
                        "Received an error response from Unstructured IO: {}",
                        error_text
                    ))
                };
            }
            Err(e) => {
                log::warn!("Encountered an error while sending the request: {}", e);
            }
        }

        if let Some(next_backoff) = backoff.next_backoff() {
            sleep(next_backoff);
        } else {
            return Err(anyhow!("Reached maximum retry attempts"));
        }
    }
}
