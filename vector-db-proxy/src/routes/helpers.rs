use crate::vector_databases::error::VectorDatabaseError;
use serde_json::Value;

pub fn format_error_message(msg: VectorDatabaseError) -> Option<Value> {
    let error_message_str = format!("{}", msg);
    let error_message_json: Option<Value> = error_message_str
        .split("content: ")
        .nth(1)
        .and_then(|json_part| serde_json::from_str(json_part).ok());
    error_message_json
}
