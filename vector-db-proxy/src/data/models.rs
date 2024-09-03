#[derive(Copy, Clone)]
pub enum FileType {
    PDF,
    TXT,
    CSV,
    DOCX,
    MARKDOWN,
    UNKNOWN,
}

impl FileType {
    pub fn to_str(Self) -> &str {}
}

impl From<String> for FileType {
    fn from(value: String) -> Self {
        match value.as_str() {
            "pdf" => Self::PDF,
            "txt" => Self::TXT,
            "csv" => Self::CSV,
            "markdown" => Self::MARKDOWN,
            "docx" | "pptx" | "xlsx" | "odt" | "ods" | "odp" => Self::DOCX,
            _ => Self::UNKNOWN,
        }
    }
}


