
#[derive(Copy, Clone)]
pub enum FileType {
    PDF,
    TXT,
    CSV,
    DOCX,
    UNKNOWN,
}

impl From<String> for FileType {
    fn from(value: String) -> Self {
        match value.as_str() {
            "pdf" => Self::PDF,
            "txt" => Self::TXT,
            "csv" => Self::CSV,
            "docx" | "pptx" | "xlsx" | "odt" | "ods" | "odp" => Self::DOCX,
            _ => Self::UNKNOWN,
        }
    }
}

