use serde::{Deserialize, Serialize};

#[derive(Copy, Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FileType {
    PDF,
    TXT,
    CSV,
    DOCX,
    MARKDOWN,
    UNKNOWN,
}

impl FileType {
    pub fn to_str<'a>(value: Self) -> &'a str {
        match value {
            Self::MARKDOWN => "markdown",
            Self::CSV => "csv",
            Self::DOCX => "docx",
            Self::PDF => "pdf",
            Self::TXT => "txt",
            _ => "unknown",
        }
    }
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
