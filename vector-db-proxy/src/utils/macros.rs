#[macro_export]
macro_rules! convert_bson_to_string_or_return_empty {
    ($e:expr) => {{
        $e.map(|value|
            value.as_str())
            .unwrap_or(Some(""))
        .map(|value|
            value.to_string())
        .unwrap_or_else(|| { "".to_string() })
    }};
}

#[macro_export]
macro_rules! hash_map_values_as_serde_values {
    ($row:expr) => {{
        use std::collections::HashMap;
        use serde_json::Value;

        let payload: HashMap<String, Value> = $row
            .iter()
            .filter_map(|(k, v)| {
                if let Ok(value) = serde_json::from_str::<Value>(v.to_string().as_str()) {
                    Some((k.clone(), value))
                } else {
                    None
                }
            })
            .collect();
        payload
    }};
}