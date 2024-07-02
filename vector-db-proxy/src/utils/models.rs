pub enum FileSources {
    GCS,
    LOCAL,
    UNKNOWN,
}

impl From<String> for FileSources {
    fn from(value: String) -> Self {
        match value.as_str() {
            "google" => FileSources::GCS,
            "local" => FileSources::LOCAL,
            _ => FileSources::UNKNOWN
        }
    }
}
