pub struct RabbitConnect {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
}


impl Default for RabbitConnect {
    fn default() -> Self {
        RabbitConnect {
            host: String::from("localhost"),
            port: 5672,
            username: String::from("guest"),
            password: String::from("guest"),
        }
    }
}