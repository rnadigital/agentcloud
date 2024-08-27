pub fn calculate_vector_storage_size(number_of_vectors: usize, vector_length: usize) -> f64 {
    (number_of_vectors * vector_length * 4) as f64 * 1.15
}
