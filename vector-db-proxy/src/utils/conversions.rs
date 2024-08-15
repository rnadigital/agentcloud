use crate::routes::models::FilterConditions;
use qdrant_client::qdrant::Condition;
use serde_json::{Map, Value};
use std::collections::HashMap;

pub fn convert_serde_value_to_hashmap_string(
    serde_value: Map<String, Value>,
) -> HashMap<String, String> {
    let hashmap_serde: HashMap<String, String> = serde_value
        .iter()
        .map(|(k, v)| (k.clone(), v.to_owned().to_string()))
        .collect();
    hashmap_serde
}

pub fn convert_hashmap_to_qdrant_filters(
    filters: &Option<FilterConditions>,
) -> (Vec<Condition>, Vec<Condition>, Vec<Condition>) {
    let mut must_vec: Vec<Condition> = vec![];
    let mut must_not_vec: Vec<Condition> = vec![];
    let mut should_vec: Vec<Condition> = vec![];

    fn process_filters(filters: Vec<HashMap<String, String>>, target_vec: &mut Vec<Condition>) {
        for f in filters {
            for (k, v) in f {
                target_vec.push(Condition::matches(k.to_string(), v.to_string()));
            }
        }
    }

    if let Some(filters) = &filters {
        process_filters(filters.must.to_vec(), &mut must_vec);
        process_filters(filters.must_not.to_vec(), &mut must_not_vec);
        process_filters(filters.should.to_vec(), &mut should_vec);
    }

    (must_vec, must_not_vec, should_vec)
}
