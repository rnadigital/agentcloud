#[derive(Copy, Clone)]
pub enum EmbeddingModels {
    OAI_ADA,
    OAI_SMALL,
    OAI_LARGE,
    BAAI_BGE_SMALL_EN,
    BAAI_BGE_SMALL_EN_V1_5,
    BAAI_BGE_BASE_EN,
    BAAI_BGE_BASE_EN_V1_5,
    BAAI_FAST_BGE_SMALL_ZH_V1_5,
    ENTENCE_TRANSFORMERS_ALL_MINILM_L6_V2,
    XENOVA_FAST_MULTILINGUAL_E5_LARGE,
    FASTEMBED,
    UNKNOWN,
}
impl From<String> for EmbeddingModels {
    fn from(value: String) -> Self {
        match value.as_str() {
            "text-embedding-ada-002" => EmbeddingModels::OAI_ADA,
            "text-embedding-3-small" => EmbeddingModels::OAI_SMALL,
            "text-embedding-3-large" => EmbeddingModels::OAI_LARGE,
            "BAAI/bge-small-en" => EmbeddingModels::BAAI_BGE_SMALL_EN,
            "BAAI/bge-small-en-v1.5" => EmbeddingModels::BAAI_BGE_SMALL_EN_V1_5,
            "BAAI/bge-base-en" => EmbeddingModels::BAAI_BGE_BASE_EN,
            "BAAI/bge-base-en-v1.5" => EmbeddingModels::BAAI_BGE_BASE_EN_V1_5,
            "BAAI/fast-bge-small-zh-v1.5" => EmbeddingModels::BAAI_FAST_BGE_SMALL_ZH_V1_5,
            "entence-transformers/all-MiniLM-L6-v2" => EmbeddingModels::ENTENCE_TRANSFORMERS_ALL_MINILM_L6_V2,
            "xenova/fast-multilingual-e5-large" => EmbeddingModels::XENOVA_FAST_MULTILINGUAL_E5_LARGE,
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
            EmbeddingModels::BAAI_BGE_SMALL_EN => "BAAI/bge-small-en",
            EmbeddingModels::BAAI_BGE_SMALL_EN_V1_5 => "BAAI/bge-small-en-v1.5",
            EmbeddingModels::BAAI_BGE_BASE_EN => "BAAI/bge-base-en",
            EmbeddingModels::BAAI_BGE_BASE_EN_V1_5 => "BAAI/bge-base-en-v1.5",
            EmbeddingModels::BAAI_FAST_BGE_SMALL_ZH_V1_5 => "BAAI/fast-bge-small-zh-v1.5",
            EmbeddingModels::ENTENCE_TRANSFORMERS_ALL_MINILM_L6_V2 => "entence-transformers/all-MiniLM-L6-v2",
            EmbeddingModels::XENOVA_FAST_MULTILINGUAL_E5_LARGE => "xenova/fast-multilingual-e5-large",
            EmbeddingModels::FASTEMBED => "fastembed",
            EmbeddingModels::UNKNOWN => "unknown",
        }
    }
}
