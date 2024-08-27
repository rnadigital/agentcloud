use std::hash::{DefaultHasher, Hash, Hasher};

pub fn hash_string(string: String) -> u64 {
    let mut hasher = DefaultHasher::new();
    string.hash(&mut hasher);
    hasher.finish()
}
