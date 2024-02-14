#![allow(dead_code)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_assignments)]

mod data;
mod errors;
mod gcp;
mod init;
mod llm;
mod mongo;
mod qdrant;
mod queue;
mod rabbitmq;
mod routes;
mod utils;

use qdrant::client::instantiate_qdrant_client;
use std::sync::{Arc};

use crate::init::models::GlobalData;
use actix_cors::Cors;
use actix_web::rt::System;
use actix_web::{middleware::Logger, web, web::Data, App, HttpServer};
use anyhow::Context;
use env_logger::Env;
use once_cell::sync::Lazy;
use tokio::join;
#[cfg(unix)]
use tokio::signal::unix::{signal, SignalKind};
#[cfg(windows)]
use tokio::signal::windows::ctrl_c;
use tokio::sync::RwLock;

use crate::init::env_variables::set_all_env_vars;
<<<<<<< Updated upstream
use crate::queue::queuing::{Control, MyQueue};
=======
use crate::mongo::client::start_mongo_connection;
>>>>>>> Stashed changes
use crate::rabbitmq::consume::subscribe_to_queue;
use crate::rabbitmq::models::RabbitConnect;
use routes::api_routes::{
    bulk_upsert_data_to_collection, create_collection, delete_collection, health_check,
    list_collections, lookup_data_point, prompt, scroll_data, upsert_data_point_to_collection,
};

pub fn init(config: &mut web::ServiceConfig) {
    let webapp_url =
        dotenv::var("webapp_url").unwrap_or("https://rapdev-app.getmonita.io".to_string());
    let cors = Cors::default()
        .allowed_origin(webapp_url.as_str())
        .allowed_methods(["GET", "POST", "PUT", "OPTIONS"])
        .supports_credentials()
        .allow_any_header();

    config.service(
        web::scope("/api/v1")
            .wrap(cors)
            .service(health_check)
            .service(list_collections)
            .service(delete_collection)
            .service(create_collection)
            .service(upsert_data_point_to_collection)
            .service(bulk_upsert_data_to_collection)
            .service(lookup_data_point)
            .service(prompt)
            .service(scroll_data),
    );
}

pub static GLOBAL_DATA: Lazy<RwLock<GlobalData>> = Lazy::new(|| {
    let data: GlobalData = GlobalData::new();
    RwLock::new(data)
});

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    log::info!("Starting Vector DB Proxy APP...");
    let global_data = GLOBAL_DATA.read().await;
    let _ = set_all_env_vars().await;
    let host = global_data.host.clone();
    let port = global_data.port.clone();
    let rabbitmq_host = global_data.rabbitmq_host.clone();
    let rabbitmq_port = global_data.rabbitmq_port;
    let rabbitmq_stream = global_data.rabbitmq_stream.clone();
    let rabbitmq_exchange = global_data.rabbitmq_exchange.clone();
    let rabbitmq_routing_key = global_data.rabbitmq_routing_key.clone();
    let rabbitmq_username = global_data.rabbitmq_username.clone();
    let rabbitmq_password = global_data.rabbitmq_password.clone();
    // Set the default logging level
    println!("Rabbit MQ Streaming Queue: {}", rabbitmq_stream);
    let qdrant_client = match instantiate_qdrant_client().await {
        Ok(client) => client,
        Err(e) => {
            tracing::error!("An error occurred while trying to connect to Qdrant DB {e}");
            panic!("An error occurred while trying to connect to Qdrant DB {e}")
        }
    };
    let mongo_connection = start_mongo_connection().await.unwrap();
    let app_qdrant_client = Arc::new(RwLock::new(qdrant_client));
    let qdrant_connection_for_rabbitmq = Arc::clone(&app_qdrant_client);
<<<<<<< Updated upstream
    let queue: Arc<RwLock<MyQueue<String>>> = Arc::new(RwLock::new(Control::default()));
    // TODO: include mongo connection in app data to reduce number of connections made to mongo!
=======
    let mongo_client_clone = Arc::new(RwLock::new(mongo_connection));
>>>>>>> Stashed changes
    let rabbitmq_connection_details = RabbitConnect {
        host: rabbitmq_host,
        port: rabbitmq_port,
        username: rabbitmq_username,
        password: rabbitmq_password,
    };
    let rabbitmq_stream = tokio::spawn(async move {
        let _ = subscribe_to_queue(
            Arc::clone(&qdrant_connection_for_rabbitmq),
<<<<<<< Updated upstream
            Arc::clone(&queue),
=======
            Arc::clone(&mongo_client_clone),
>>>>>>> Stashed changes
            rabbitmq_connection_details,
            rabbitmq_exchange.as_str(),
            rabbitmq_stream.as_str(),
            rabbitmq_routing_key.as_str(),
        )
        .await;
    });
    env_logger::Builder::from_env(Env::default().default_filter_or("info")).init();
    let web_task = tokio::spawn(async move {
        println!("Running on http://{}:{}", host.clone(), port.clone());
        let server = HttpServer::new(move || {
            App::new()
                .wrap(Logger::default())
                .app_data(Data::new(Arc::clone(&app_qdrant_client)))
                .configure(init)
        })
        .bind(format!("{}:{}", host, port))?
        .run();

        // Handle SIGINT to manually kick-off graceful shutdown
        tokio::spawn(async move {
            #[cfg(unix)]
            let mut stream = signal(SignalKind::interrupt()).unwrap();
            #[cfg(windows)]
            let mut stream = ctrl_c().unwrap();
            stream.recv().await;
            System::current().stop();
        });
        server.await.context("server error!")
    });

    let _ = join!(web_task, rabbitmq_stream);
    Ok(())
}
