use fastembed::EmbeddingModel;
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
    UNKNOWN,
}
impl From<String> for EmbeddingModels {
    fn from(value: String) -> Self {
        match value.as_str() {
            "text-embedding-ada-002" => EmbeddingModels::OAI_ADA,
            "text-embedding-3-small" => EmbeddingModels::OAI_SMALL,
            "text-embedding-3-large" => EmbeddingModels::OAI_LARGE,
            "fast-bge-small-en"=> EmbeddingModels::BAAI_BGE_SMALL_EN,
            "fast-bge-small-en-v1.5"=> EmbeddingModels::BAAI_BGE_SMALL_EN_V1_5,
            "fast-bge-base-en"=> EmbeddingModels::BAAI_BGE_BASE_EN,
            "fast-bge-base-en-v1.5" => EmbeddingModels::BAAI_BGE_BASE_EN_V1_5,
            "fast-bge-small-zh-v1.5" => EmbeddingModels::BAAI_FAST_BGE_SMALL_ZH_V1_5,
            "fast-all-MiniLM-L6-v2" => EmbeddingModels::ENTENCE_TRANSFORMERS_ALL_MINILM_L6_V2,
            "fast-multilingual-e5-large" => EmbeddingModels::XENOVA_FAST_MULTILINGUAL_E5_LARGE,
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
            EmbeddingModels::BAAI_BGE_SMALL_EN => "fast-bge-small-en",
            EmbeddingModels::BAAI_BGE_SMALL_EN_V1_5 => "fast-bge-small-en-v1.5",
            EmbeddingModels::BAAI_BGE_BASE_EN => "fast-bge-base-en",
            EmbeddingModels::BAAI_BGE_BASE_EN_V1_5 => "fast-bge-base-en-v1.5",
            EmbeddingModels::BAAI_FAST_BGE_SMALL_ZH_V1_5 => "fast-bge-small-zh-v1.5",
            EmbeddingModels::ENTENCE_TRANSFORMERS_ALL_MINILM_L6_V2 => "fast-all-MiniLM-L6-v2",
            EmbeddingModels::XENOVA_FAST_MULTILINGUAL_E5_LARGE => "fast-multilingual-e5-large",
            EmbeddingModels::UNKNOWN => "unknown",
        }
    }
}

pub enum FastEmbedModels {
    BAAI_BGE_SMALL_EN,
    BAAI_BGE_SMALL_EN_V1_5,
    BAAI_BGE_BASE_EN,
    BAAI_BGE_BASE_EN_V1_5,
    BAAI_FAST_BGE_SMALL_ZH_V1_5,
    ENTENCE_TRANSFORMERS_ALL_MINILM_L6_V2,
    XENOVA_FAST_MULTILINGUAL_E5_LARGE,
    UNKNOWN,
}

impl From<String> for FastEmbedModels {
    fn from(value: String) -> Self {
        match value.as_str() {
            "fast-bge-small-en" => FastEmbedModels::BAAI_BGE_SMALL_EN,
            "fast-bge-small-en-v1.5" => FastEmbedModels::BAAI_BGE_SMALL_EN_V1_5,
            "fast-bge-base-en" => FastEmbedModels::BAAI_BGE_BASE_EN,
            "fast-bge-base-en-v1.5" => FastEmbedModels::BAAI_BGE_BASE_EN_V1_5,
            "fast-bge-small-zh-v1.5" => FastEmbedModels::BAAI_FAST_BGE_SMALL_ZH_V1_5,
            "fast-all-MiniLM-L6-v2" => {
                FastEmbedModels::ENTENCE_TRANSFORMERS_ALL_MINILM_L6_V2
            }
            "fast-multilingual-e5-large" => {
                FastEmbedModels::XENOVA_FAST_MULTILINGUAL_E5_LARGE
            }
            _ => FastEmbedModels::UNKNOWN,
        }
    }
}

impl FastEmbedModels {
    pub fn translate(&self) -> EmbeddingModel {
        match self {
            FastEmbedModels::BAAI_BGE_SMALL_EN => EmbeddingModel::BGESmallEN,
            FastEmbedModels::BAAI_BGE_BASE_EN => EmbeddingModel::BGEBaseEN,
            FastEmbedModels::BAAI_BGE_SMALL_EN_V1_5 => EmbeddingModel::BGESmallENV15,
            FastEmbedModels::BAAI_BGE_BASE_EN_V1_5 => EmbeddingModel::BGEBaseENV15,
            FastEmbedModels::BAAI_FAST_BGE_SMALL_ZH_V1_5 => EmbeddingModel::BGESmallZH,
            FastEmbedModels::ENTENCE_TRANSFORMERS_ALL_MINILM_L6_V2 => EmbeddingModel::AllMiniLML6V2,
            FastEmbedModels::XENOVA_FAST_MULTILINGUAL_E5_LARGE => EmbeddingModel::MLE5Large,
            _ => todo!(),
        }
    }
}
