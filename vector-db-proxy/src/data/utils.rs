use ndarray::Array1;
pub fn cosine_similarity(a: &Array1<f64>, b: &Array1<f64>) -> f64 {
    let dot_product = a.dot(b);
    let norm_a = a.dot(a).sqrt();
    let norm_b = b.dot(b).sqrt();
    dot_product / (norm_a * norm_b)
}

pub fn percentile(values: &[f64], percentile: usize) -> f64 {
    assert!(!values.is_empty(), "Values cannot be empty");
    assert!(percentile <= 100, "Percentile must be between 0 and 100");

    let mut sorted_values = values.to_vec();
    sorted_values.sort_by(|a, b| a.partial_cmp(b).unwrap());

    let k = (percentile as f64 / 100.0 * (values.len() as f64 - 1.0)).round() as usize;
    sorted_values[k]
}
