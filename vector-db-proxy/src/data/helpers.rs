use std::hash::{DefaultHasher, Hash, Hasher};
use uuid::Uuid;

pub fn hash_string_to_uuid(hashing_salt: &str, string: &str) -> String {
    // Create a hasher for the first 64 bits
    let mut hasher1 = DefaultHasher::new();
    string.hash(&mut hasher1);
    let hash1 = hasher1.finish();

    // Create a hasher for the second 64 bits
    let mut hasher2 = DefaultHasher::new();

    format!("{}{}", string, hashing_salt).hash(&mut hasher2); // Adding a "salt" to differentiate the hashes
    let hash2 = hasher2.finish();

    // Combine the two 64-bit hashes into a 128-bit array
    let mut uuid_bytes = [0u8; 16];
    uuid_bytes[..8].copy_from_slice(&hash1.to_be_bytes());
    uuid_bytes[8..].copy_from_slice(&hash2.to_be_bytes());

    // Convert the 128-bit array into a UUID
    Uuid::from_bytes(uuid_bytes).to_string()
}
