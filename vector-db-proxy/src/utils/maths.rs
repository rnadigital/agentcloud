pub fn mean_of_vec(vector: &Vec<f32>) -> Option<f32>{
    if !vector.is_empty(){
        let vector_sum: f32 = vector.iter().sum();
        Some(vector_sum / vector.len() as f32)
    }else {
        return None;
    }
}

pub fn negative_vector(vector: &mut Vec<f32>) -> Option<Vec<f32>>{
    if !vector.is_empty(){
        for num in vector.iter_mut() {
            *num *= -1.0;
        };
        return Some(vector.to_owned());

    }
    return None;
}