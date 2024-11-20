use crate::vector_databases::models::FilterConditions;
use qdrant_client::qdrant::condition::ConditionOneOf;
use qdrant_client::qdrant::Condition;
use serde_json::{Map, Value};
use std::collections::HashMap;

pub fn convert_serde_value_to_hashmap_string(
    serde_value: Map<String, Value>,
) -> HashMap<String, String> {
    let hashmap_serde: HashMap<String, String> = serde_value
        .iter()
        .map(|(k, v)| (k.clone(), serde_json::to_string(&v.to_owned()).unwrap()))
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
        process_filters(filters.must.clone().unwrap().to_vec(), &mut must_vec);
        process_filters(
            filters.must_not.clone().unwrap().to_vec(),
            &mut must_not_vec,
        );
        process_filters(filters.should.clone().unwrap().to_vec(), &mut should_vec);
    }

    (must_vec, must_not_vec, should_vec)
}

pub fn condition_to_hash_map(condition: Condition) -> HashMap<String, String> {
    let mut map = HashMap::new();
    if let Some(condition_one_of) = condition.condition_one_of {
        // Convert the `ConditionOneOf` to a string representation
        let value_string = condition_one_of_to_string(condition_one_of);
        map.insert("condition".to_string(), value_string);
    }
    map
}

/// Convert a `ConditionOneOf` to a `String`.
fn condition_one_of_to_string(condition: ConditionOneOf) -> String {
    match condition {
        ConditionOneOf::Field(field_condition) => format!("FieldCondition: {:?}", field_condition),
        ConditionOneOf::IsEmpty(is_empty_condition) => {
            format!("IsEmptyCondition: {:?}", is_empty_condition)
        }
        ConditionOneOf::HasId(has_id_condition) => {
            format!("HasIdCondition: {:?}", has_id_condition)
        }
        ConditionOneOf::Filter(filter_condition) => {
            format!("FilterCondition: {:?}", filter_condition)
        }
        ConditionOneOf::IsNull(is_null_condition) => {
            format!("IsNullCondition: {:?}", is_null_condition)
        }
        ConditionOneOf::Nested(nested_condition) => {
            format!("NestedCondition: {:?}", nested_condition)
        }
    }
}
