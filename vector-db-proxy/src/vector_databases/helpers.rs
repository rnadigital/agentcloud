use prost_types::value::Kind;
use prost_types::{ListValue, Struct, Value as ProstValue};
use serde_json::Value;
use std::collections::HashMap;

fn list_value_to_string(list_value: &ListValue) -> Option<String> {
    let values: Vec<String> = list_value
        .values
        .iter()
        .filter_map(|v| value_to_string(&v.kind)) // Recursively handle each value in the list
        .collect();

    Some(format!("[{}]", values.join(", ")))
}

fn struct_value_to_string(struct_value: &Struct) -> Option<String> {
    let mut map = HashMap::new();

    for (key, value) in &struct_value.fields {
        if let Some(value_str) = value_to_string(&value.kind) {
            // Recursively handle each value in the struct
            map.insert(key.clone(), value_str);
        }
    }
    // Return the map as a JSON string
    Some(serde_json::to_string(&map).unwrap_or_else(|_| "{}".to_string()))
}

fn value_to_string(value: &Option<Kind>) -> Option<String> {
    match value {
        Some(kind) => match kind {
            Kind::StringValue(s) => Some(s.to_owned().as_str().to_string()),
            Kind::NumberValue(n) => Some(n.to_string()),
            Kind::BoolValue(b) => Some(b.to_string()),
            Kind::NullValue(i) => Some(i.to_string()),
            Kind::ListValue(l) => list_value_to_string(l),
            Kind::StructValue(s) => struct_value_to_string(s),
        },
        None => None,
    }
}

pub fn prost_to_serde(prost_value: &ProstValue) -> Value {
    match &prost_value.kind {
        Some(Kind::NullValue(_)) => Value::Null,
        Some(Kind::NumberValue(n)) => {
            // Convert f64 to serde_json::Number, handling cases where the conversion might fail
            serde_json::Number::from_f64(*n)
                .map(Value::Number)
                .unwrap_or_else(|| Value::Null)
        }
        Some(Kind::StringValue(s)) => Value::String(s.clone()),
        Some(Kind::BoolValue(b)) => Value::Bool(*b),
        Some(Kind::StructValue(struct_value)) => {
            let map = struct_value
                .fields
                .iter()
                .map(|(k, v)| (k.clone(), prost_to_serde(v)))
                .collect();
            Value::Object(map)
        }
        Some(Kind::ListValue(list_value)) => {
            let vec = list_value.values.iter().map(prost_to_serde).collect();
            Value::Array(vec)
        }
        None => Value::Null,
    }
}

fn serde_to_prost(serde_value: &Value) -> ProstValue {
    let kind = match serde_value {
        Value::Null => Some(Kind::NullValue(0)),
        Value::Bool(b) => Some(Kind::BoolValue(*b)),
        Value::Number(n) => {
            // Extract f64 value from serde_json::Number
            n.as_f64()
                .map(Kind::NumberValue)
                .or_else(|| n.as_i64().map(|i| Kind::NumberValue(i as f64)))
                .or_else(|| n.as_u64().map(|u| Kind::NumberValue(u as f64)))
        }
        Value::String(s) => Some(Kind::StringValue(s.clone())),
        Value::Array(arr) => {
            let values = arr.iter().map(serde_to_prost).collect();
            Some(Kind::ListValue(ListValue { values }))
        }
        Value::Object(map) => {
            let fields = map
                .iter()
                .map(|(k, v)| (k.clone(), serde_to_prost(v)))
                .collect();
            Some(Kind::StructValue(Struct { fields }))
        }
    };
    ProstValue { kind }
}