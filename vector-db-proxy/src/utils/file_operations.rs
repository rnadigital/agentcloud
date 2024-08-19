use crate::adaptors::gcp::gcs::get_object_from_gcs;
use crate::data::models::FileType;
use crate::utils::models::FileSources;
use serde_json::Value;
use std::fs::File;
use std::io::Write;
use tokio::fs;

pub async fn save_file_to_disk(content: Vec<u8>, file_name: &str) -> anyhow::Result<()> {
    let file_path = file_name.trim_matches('"');
    log::info!("File path : {}", file_path);
    let mut file = File::create(file_path)?;
    file.write_all(&content)?; // handle errors
    Ok(())
}

pub fn determine_file_type(file_path: &str) -> FileType {
    let file_path = format!("{}", file_path);
    let file_path_split: Vec<&str> = file_path.split(".").collect();
    let file_extension = file_path_split.to_vec()[1]
        .to_string()
        .trim_end_matches('"')
        .to_string();
    let file_type = FileType::from(file_extension);
    file_type
}

pub async fn read_file_from_source(
    stream_type: Option<String>,
    message_data: Value,
) -> Option<(FileType, Vec<u8>, String)> {
    // If the type field is present in the headers then we assume it is a file of sorts
    match stream_type {
        Some(t) => match FileSources::from(t) {
            FileSources::GCS => {
                if let Some(bucket_name) = message_data.get("bucket") {
                    if let Some(file_name) = message_data.get("filename") {
                        match get_object_from_gcs(bucket_name.as_str()?, file_name.as_str()?).await
                        {
                            Ok(file) => {
                                let file_type = determine_file_type(file_name.as_str()?);
                                let result = (file_type, file, file_name.to_string());
                                Some(result)
                            }
                            Err(e) => {
                                log::error!("An error occurred while reading file from GCS: {}", e);
                                None
                            }
                        }
                    } else {
                        log::warn!("Filename not in message");
                        None
                    }
                } else {
                    log::warn!("bucket not in message");
                    None
                }
            }
            FileSources::LOCAL => {
                if let Some(file_path) = message_data.get("file") {
                    match fs::read(file_path.as_str()?).await {
                        Ok(file) => {
                            let file_type = determine_file_type(file_path.as_str()?);
                            let results = (file_type, file, file_path.to_string());
                            Some(results)
                        }
                        Err(e) => {
                            log::error!("An error occurred while reading file from DISK, {}", e);
                            None
                        }
                    }
                } else {
                    log::error!("No file path in message data");
                    None
                }
            }
            FileSources::UNKNOWN => {
                log::warn!("File source unknown");
                None
            }
        },
        None => None,
    }
}
