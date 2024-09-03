use crate::adaptors::mongo::models::{
    UnstructuredChunkingConfig, UnstructuredChunkingStrategy, UnstructuredPartitioningStrategy,
};
use crate::data::models::FileType;
use crate::data::unstructuredio::models::UnstructuredIOResponse;
use anyhow::{anyhow, Result};
use reqwest::blocking::multipart::{Form, Part};
use reqwest::blocking::Client;
use reqwest::header::{HeaderMap, HeaderValue};
use std::io::Cursor;
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
        form = form.text("chunking_strategy", chunking_strategy);

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
    let client = Client::builder()
        .timeout(Duration::from_secs(2000))
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()?;
    // Create a multipart form with the file and sends the POST request
    let mut header_map = HeaderMap::new();
    header_map.insert("accept", HeaderValue::from_str("application/json")?);
    let form =
        chunking_strategy_to_form_data(file_buffer, file_name, chunking_strategy, file_type)?;
    api_key
        .map(|key| header_map.insert("unstructured-api-key", HeaderValue::from_str(&key).unwrap()));
    match client.post(url).headers(header_map).multipart(form).send() {
        Ok(response_obj) => match response_obj.json::<Vec<UnstructuredIOResponse>>() {
            Ok(unstructuredio_response) => Ok(unstructuredio_response),
            Err(e) => Err(anyhow!(
                "An error occurred while unpacking the response from Unstructured IO. Error : {:?}",
                e
            )),
        },
        Err(e) => Err(anyhow!("Encountered an error: {}", e)),
    }
}
