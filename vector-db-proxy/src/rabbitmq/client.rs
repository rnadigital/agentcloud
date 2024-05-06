use crate::rabbitmq::models::RabbitConnect;
use amqp_serde::types::{FieldTable, FieldValue, ShortStr};
use amqprs::channel::{Channel, ExchangeDeclareArguments};
use amqprs::{
    callbacks::{DefaultChannelCallback, DefaultConnectionCallback},
    channel::{BasicQosArguments, QueueBindArguments, QueueDeclareArguments},
    connection::{Connection, OpenConnectionArguments},
};
use tokio::time::{sleep, Duration};

pub async fn connect_rabbitmq(connection_details: &RabbitConnect) -> Option<Connection> {
    println!("RabbitMQ Host: {}", connection_details.host);
    println!("RabbitMQ Port: {}", connection_details.port);
    let max_connection_attempts = 50;
    let mut res = Connection::open(
        OpenConnectionArguments::new(
            &connection_details.host,
            connection_details.port,
            &connection_details.username,
            &connection_details.password,
        )
            .virtual_host("/"),
    )
        .await;
    let mut connection_attempts = 0;
    while let Err(ref e) = res {
        println!("Error while connecting to rabbitMQ. Error: {}", e);
        log::error!("An error occurred while attempting to connect to RabbitMQ: {}",e);
        while connection_attempts <= max_connection_attempts {
            log::debug!("Will try to re-connect...");
            connection_attempts += 1;
            sleep(Duration::from_millis(2000 + (connection_attempts * 2))).await;
            res = Connection::open(&OpenConnectionArguments::new(
                &connection_details.host,
                connection_details.port,
                &connection_details.username,
                &connection_details.password,
            ))
                .await;
            let connection = res.unwrap();
            connection
                .register_callback(DefaultConnectionCallback)
                .await
                .unwrap();
            return Some(connection);
        }
    }
    return None;
}

pub async fn channel_rabbitmq(connection: &Connection) -> Channel {
    let channel = connection.open_channel(None).await.unwrap();
    channel
        .register_callback(DefaultChannelCallback)
        .await
        .unwrap();
    channel
}

pub async fn bind_queue_to_exchange(
    connection: &mut Connection,
    channel: &mut Channel,
    connection_details: &RabbitConnect,
    exchange: &str,
    queue: &str,
    routing_key: &str,
) {
    if !connection.is_open() {
        log::warn!("Connection not open");
        *connection = connect_rabbitmq(connection_details).await.unwrap();
        *channel = channel_rabbitmq(connection).await;
        log::debug!("{}", connection);
    }
    // Declaring the exchange on startup
    channel
        .exchange_declare(ExchangeDeclareArguments::new(exchange, "direct"))
        .await
        .unwrap();
    // Setting up basic quality-of-service parameters for the channel to enable streaming queue
    match channel
        .basic_qos(BasicQosArguments {
            prefetch_count: 10000,
            prefetch_size: 0,
            global: false,
        })
        .await {
        Ok(_) => {}
        Err(e) => { log::error!("An error occurred while setting up the channel:{}", e) }
    }
    // adding queue type as custom arguments to the queue declaration
    let mut args: FieldTable = FieldTable::new();
    let queue_type_x: ShortStr = "x-queue-type".try_into().unwrap();
    let queue_type_q: FieldValue = "stream".into();
    args.insert(queue_type_x, queue_type_q);

    match channel
        .queue_declare(
            QueueDeclareArguments::default()
                .queue(queue.to_owned())
                .durable(true)
                .arguments(args)
                .finish(),
        )
        .await {
        Ok(queue_option) => {
            match queue_option {
                Some((queue, _, _)) => {
                    //check if the channel is open, if not then open it
                    if !channel.is_open() {
                        log::warn!(
                            "Channel is not open, does exchange {} exist on rabbitMQ?",
                            exchange
                        );
                        *channel = channel_rabbitmq(connection).await;
                    }

                    // bind the queue to the exchange using this channel
                    channel
                        .queue_bind(QueueBindArguments::new(&queue, exchange, routing_key))
                        .await
                        .unwrap();
                }
                None => {}
            }
        }
        Err(e) => {
            log::error!("An error occurred while setting up the queue: {}", e)
        }
    }
}
