use crate::adaptors::mongo::models::{
    UnstructuredChunkingConfig, UnstructuredChunkingStrategy, UnstructuredPartitioningStrategy,
};
use crate::data::models::FileType;
use crate::data::unstructuredio::models::UnstructuredIOResponse;
use crate::utils::file_operations::determine_file_type;
use anyhow::{anyhow, Result};
use reqwest::header::{HeaderMap, HeaderValue};
use reqwest::{blocking, blocking::Client};
use std::path::Path;
use std::time::Duration;

fn chunking_strategy_to_headers(
    mut header_map: HeaderMap,
    chunking_strategy: Option<UnstructuredChunkingConfig>,
    file_type: Option<FileType>,
) -> Result<HeaderMap> {
    if let Some(strategy_config) = chunking_strategy {
        let chunking_strategy = UnstructuredChunkingStrategy::as_str(&strategy_config.strategy);
        header_map.insert(
            "chunking_strategy",
            HeaderValue::from_str(chunking_strategy)?,
        );
        let max_characters = strategy_config.max_characters.to_string();
        header_map.insert(
            "max_characters",
            HeaderValue::from_str(max_characters.as_str())?,
        );
        let new_after_n_chars = strategy_config.new_after_n_chars.to_string();
        header_map.insert(
            "new_after_n_chars",
            HeaderValue::from_str(new_after_n_chars.as_str())?,
        );
        let overlap = strategy_config.overlap.to_string();
        header_map.insert("overlap", HeaderValue::from_str(overlap.as_str())?);
        let overlap_all = strategy_config.overlap_all.to_string();
        header_map.insert("overlap_all", HeaderValue::from_str(overlap_all.as_str())?);
        let partitioning_strategy =
            UnstructuredPartitioningStrategy::as_str(&strategy_config.partitioning);
        header_map.insert("strategy", HeaderValue::from_str(partitioning_strategy)?);
        if let Some(file_type) = file_type {
            match file_type {
                FileType::PDF => {
                    header_map.insert("pdf_infer_table_structure", HeaderValue::from_str("true")?);
                }
                _ => (),
            }
        }
    }
    Ok(header_map)
}

pub fn chunk_text(
    url: String,
    api_key: Option<String>,
    file_path: &str,
    chunking_strategy: Option<UnstructuredChunkingConfig>,
) -> Result<Vec<UnstructuredIOResponse>> {
    let client = Client::builder()
        .timeout(Duration::from_secs(500))
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()?;
    let file_path = file_path.trim_matches('"');
    let file_type = determine_file_type(file_path);
    let file_path = Path::new(file_path);
    println!("File path in chunk : {:?}", file_path);
    // Create a multipart form with the file
    let form =
        blocking::multipart::Form::new().part("files", blocking::multipart::Part::file(file_path)?);
    // Send the POST request
    let mut header_map = HeaderMap::new();
    header_map.insert("accept", HeaderValue::from_str("application/json")?);
    header_map = chunking_strategy_to_headers(header_map, chunking_strategy, Some(file_type))?;
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
        Err(e) => Err(anyhow!("Encountered and error: {}", e)),
    }
}
