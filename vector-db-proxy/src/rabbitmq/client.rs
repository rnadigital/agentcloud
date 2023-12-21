use crate::rabbitmq::models::RabbitConnect;
use amiquip::{Connection, Result};
use tokio::time::{sleep, Duration};

pub async fn connect_rabbitmq(connection_details: &RabbitConnect) -> Result<Connection> {
    let rabbitmq_uri = format!(
        "amqp://{}:{}@{}:{}",
        connection_details.username,
        connection_details.password,
        connection_details.host,
        connection_details.port
    );
    let mut res = Connection::insecure_open(rabbitmq_uri.as_str());

    while res.is_err() {
        println!("Connection failed. Trying to reconnect...");
        sleep(Duration::from_millis(2000)).await;
        res = Connection::insecure_open(rabbitmq_uri.as_str());
    }
    println!(
        "Connected successfully to RabbitMQ on URL: {}",
        rabbitmq_uri.as_str()
    );
    res
}
