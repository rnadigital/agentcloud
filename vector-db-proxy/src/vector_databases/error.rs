use anyhow::Error as AnyhowError;
use pinecone_sdk::utils::errors::PineconeError;
use serde::Serialize;
use std::sync::Arc;

#[derive(thiserror::Error, Debug)]
pub enum VectorDatabaseError {
    // Pinecone error
    #[error("A Pinecone error occurred: {0}")]
    PineconeError(Arc<PineconeError>),
    // Anyhow error
    #[error("An error occurred: {0}")]
    AnyhowError(#[from] AnyhowError),
    #[error("Resource was not found. {0}")]
    NotFound(String),
    /// Any other error.
    #[error("An error occurred. {0}")]
    Other(String),
}
unsafe impl Send for VectorDatabaseError {}
unsafe impl Sync for VectorDatabaseError {}
impl Clone for VectorDatabaseError {
    fn clone(&self) -> Self {
        match self {
            VectorDatabaseError::AnyhowError(e) => VectorDatabaseError::Other(e.to_string()),
            VectorDatabaseError::Other(msg) => VectorDatabaseError::Other(msg.clone()),
            VectorDatabaseError::NotFound(msg) => VectorDatabaseError::NotFound(msg.clone()),
            VectorDatabaseError::PineconeError(pe) => {
                VectorDatabaseError::PineconeError(Arc::clone(pe))
            }
        }
    }
}

impl Serialize for VectorDatabaseError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        match self {
            VectorDatabaseError::AnyhowError(err) => {
                serializer.serialize_str(&format!("An error occurred: {}", err))
            }
            VectorDatabaseError::Other(msg) => {
                serializer.serialize_str(&format!("An error occurred. {}", msg))
            }
            VectorDatabaseError::NotFound(n) => {
                serializer.serialize_str(&format!("An error occurred. {}", n))
            }
            VectorDatabaseError::PineconeError(pe) => {
                serializer.serialize_str(&format!("An error occurred. {:?}", pe))
            }
        }
    }
}
