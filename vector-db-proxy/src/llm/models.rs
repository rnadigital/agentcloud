#[derive(Copy, Clone)]
pub enum EmbeddingModels {
    OAI_ADA,
    OAI_SMALL,
    OAI_LARGE,
    FASTEMBED,
    UNKNOWN,
}
impl From<String> for EmbeddingModels {
    fn from(value: String) -> Self {
        match value.as_str() {
            "text-embedding-ada-002" => EmbeddingModels::OAI_ADA,
            "text-embedding-3-small" => EmbeddingModels::OAI_SMALL,
            "text-embedding-3-large" => EmbeddingModels::OAI_LARGE,
            "fastembed" => EmbeddingModels::FASTEMBED,
            _ => EmbeddingModels::UNKNOWN,
        }
    }
}

impl EmbeddingModels {
    pub fn to_str(&self) -> &str {
        match self {
            EmbeddingModels::OAI_ADA => "text-embedding-ada-002",
            EmbeddingModels::OAI_SMALL => "text-embedding-3-small",
            EmbeddingModels::OAI_LARGE => "text-embedding-3-large",
            EmbeddingModels::FASTEMBED => "fastembed",
            EmbeddingModels::UNKNOWN => "unknown",
        }
    }
}
