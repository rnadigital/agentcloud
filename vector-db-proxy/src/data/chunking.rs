// use anyhow::Result;
use pdf_extract::extract_text;
use lopdf::Document;
use std::str;

pub trait Chunking {
    type Item;
    fn new() -> Self;

    // async fn chunk(&self, data: &[Self::Item]) -> Result<Vec<Vec<Self::Item>>>;
    fn chunk(&self, path: &str);
}

pub struct PdfChunker;

impl Chunking for PdfChunker {
    type Item = u8;

    fn new() -> Self {
        PdfChunker {}
    }

    // fn read_text_from_pdf(){
    //
    // }

    fn chunk(&self, path: &str) {
        let doc = Document::load(path).unwrap();
        let text = extract_text(path).unwrap();
        println!("{}", text);
        }
    }

