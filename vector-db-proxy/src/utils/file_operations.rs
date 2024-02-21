use std::fs::File;
use std::io::Write;

pub async fn save_file_to_disk(content: Vec<u8>, file_name: &str) -> anyhow::Result<()> {
    let file_path = file_name.trim_matches('"');
    println!("File path : {}", file_path);
    let mut file = File::create(file_path)?;
    file.write_all(&content)?; // handle errors
    Ok(())
}
