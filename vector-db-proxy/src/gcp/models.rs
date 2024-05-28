pub struct PubSubConnect {
    pub topic: String,
    pub subscription: String,
}

impl Default for PubSubConnect {
    fn default() -> Self {
        PubSubConnect {
            topic: String::from("streaming"),
            subscription: String::from("streaming"),
        }
    }
}
