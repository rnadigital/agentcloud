use std::sync::Arc;
use crate::adaptors::rabbitmq::models::RabbitConnect;
use amqp_serde::types::{FieldTable, FieldValue, ShortStr};
use amqprs::channel::{Channel, ExchangeDeclareArguments};
use amqprs::{
    callbacks::{DefaultChannelCallback, DefaultConnectionCallback},
    channel::{BasicQosArguments, QueueBindArguments, QueueDeclareArguments},
    connection::{Connection, OpenConnectionArguments},
};
use lazy_static::lazy_static;
use tokio::sync::RwLock;

lazy_static! {
    static ref GLOBAL_CONNECTION: Arc<RwLock<Option<Connection>>> = Arc::new(RwLock::new(None));
}
pub(crate) async fn connect_rabbitmq(connection_details: &RabbitConnect) -> Connection {
    let mut res = Connection::open(
        OpenConnectionArguments::new(
            &connection_details.host,
            connection_details.port,
            &connection_details.username,
            &connection_details.password,
        )
            .heartbeat(10) // Set heartbeat interval to 10 seconds
            .virtual_host("/"),
    )
        .await;

    let mut connection_attempts = 0;
    while res.is_err() {
        connection_attempts += 1;
        let time_to_sleep = 2 + (connection_attempts * 2);
        println!("Going to sleep for '{}' seconds then will try to re-connect...", time_to_sleep);
        tokio::time::sleep(tokio::time::Duration::from_secs(time_to_sleep)).await;
        res = Connection::open(
            &OpenConnectionArguments::new(
                &connection_details.host,
                connection_details.port,
                &connection_details.username,
                &connection_details.password,
            )
                .heartbeat(10) // Set heartbeat interval to 10 seconds
        )
            .await;
    }

    let connection = res.unwrap();
    connection
        .register_callback(DefaultConnectionCallback)
        .await
        .unwrap();

    connection
}

pub(crate) async fn ensure_connection(connection_details: &RabbitConnect) -> Arc<RwLock<Connection>> {
    let global_conn = Arc::clone(&GLOBAL_CONNECTION);
    {
        let mut conn_guard = global_conn.write().await;
        if conn_guard.is_none() || !conn_guard.as_ref().unwrap().is_open() {
            let new_connection = connect_rabbitmq(connection_details).await;
            *conn_guard = Some(new_connection);
        }
    }
    let conn_guard = global_conn.read().await;
    Arc::new(RwLock::new(conn_guard.as_ref().unwrap().clone()))
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
    connection_details: &RabbitConnect,
    exchange: &str,
    queue: &str,
    routing_key: &str,
) -> Channel {
    let connection = ensure_connection(connection_details).await;
    let connection = connection.read().await;
    let channel = channel_rabbitmq(&connection).await;
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
                    // Bind the queue to the exchange using this channel
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

    channel
}