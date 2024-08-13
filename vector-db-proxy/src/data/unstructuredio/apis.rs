use crate::data::unstructuredio::models::UnstructuredIOResponse;
use anyhow::{anyhow, Result};
use reqwest::header::{HeaderMap, HeaderValue};
use reqwest::{blocking, blocking::Client};
use std::path::Path;
use std::time::Duration;

pub fn chunk_text(
    url: String,
    api_key: Option<String>,
    file_path: &str,
) -> Result<Vec<UnstructuredIOResponse>> {
    let client = Client::builder()
        .timeout(Duration::from_secs(500))
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()?;
    let file_path = file_path.trim_matches('"');
    let file_path = Path::new(file_path);
    println!("File path in chunk : {:?}", file_path);
    // Create a multipart form with the file
    let form = blocking::multipart::Form::new().part("files", blocking::multipart::Part::file
        (file_path)?);
    // Send the POST request
    let mut header_map = HeaderMap::new();
    header_map.insert("accept", HeaderValue::from_str("application/json")?);
    api_key.map(|key| header_map.insert("unstructured-api-key", HeaderValue::from_str(&key).unwrap()));
    match client.post(url).headers(header_map)
        .multipart(form)
        .send() {
        Ok(response_obj) => {
            match response_obj.json::<Vec<UnstructuredIOResponse>>() {
                Ok(unstructuredio_response) => Ok(unstructuredio_response),
                Err(e) => Err(anyhow!("An error occurred while unpacking the response from Unstructured IO. Error : {:?}", e))
            }
        }
        Err(e) => {
            Err(anyhow!("Encountered and error: {}", e))
        }
    }
}