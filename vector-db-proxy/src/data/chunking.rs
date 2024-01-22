use anyhow::Result;

pub enum ChunkingStrategy {
    SEMANTIC_CHUNKING,
    CODE_SPLIT,
}

pub trait Chunking {
    type Item;
    fn new() -> Self;
    fn extract_text_from_pdf(&self, path: &str) -> Result<String>;
    fn chunk(&self, data: String, strategy: ChunkingStrategy) -> Result<String>;
}

pub struct PdfChunker;

impl Chunking for PdfChunker {
    type Item = u8;

    fn new() -> Self {
        PdfChunker {}
    }

    fn extract_text_from_pdf(&self, path: &str) -> Result<String> {
        let mut text = String::new(); // we will instantiate this so we always have something to return
        if let Ok(doc) = lopdf::Document::load(path) {
            // Change this to load from mem
            let pages = doc.get_pages();
            for (page_id, page) in pages {
                println!("Page number: {}", page_id);
                text = pdf_extract::extract_text(path).unwrap();
            }
        }
        println!("Final Text: {}", text);
        Ok(text)
    }

    fn chunk(&self, data: String, strategy: ChunkingStrategy) -> Result<String> {

        match strategy {
            ChunkingStrategy::SEMANTIC_CHUNKING =>{},
            ChunkingStrategy::CODE_SPLIT => {}
        }

        Ok(String::new())
    }
}
