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
mod redis_rs;

use qdrant::client::instantiate_qdrant_client;
use std::sync::{Arc};

use crate::init::env_variables::GLOBAL_DATA;
use actix_cors::Cors;
use actix_web::rt::System;
use actix_web::{middleware::Logger, web, web::Data, App, HttpServer};
use anyhow::Context;
use env_logger::Env;
use tokio::join;
#[cfg(unix)]
use tokio::signal::unix::{signal, SignalKind};
#[cfg(windows)]
use tokio::signal::windows::ctrl_c;
use tokio::sync::{RwLock};

use crate::init::env_variables::set_all_env_vars;
use crate::rabbitmq::consume::subscribe_to_queue;
use crate::rabbitmq::models::RabbitConnect;
use routes::api_routes::{
    bulk_upsert_data_to_collection, check_collection_exists, delete_collection, health_check,
    list_collections, lookup_data_point, scroll_data, upsert_data_point_to_collection,
};
use crate::mongo::client::start_mongo_connection;
use crate::queue::queuing::Pool;
use crate::rabbitmq::client::{bind_queue_to_exchange, channel_rabbitmq, connect_rabbitmq};

pub fn init(config: &mut web::ServiceConfig) {
    // let webapp_url =
    //     dotenv::var("webapp_url").unwrap_or("https://127.0.0.1:3000".to_string());
    let cors = Cors::default()
        // .allowed_origin(webapp_url.as_str())
        .allow_any_origin()
        .allowed_methods(["GET", "POST", "PUT", "OPTIONS"])
        .supports_credentials()
        .allow_any_header();

    config.service(
        web::scope("/api/v1")
            .wrap(cors)
            .service(health_check)
            .service(list_collections)
            .service(delete_collection)
            .service(check_collection_exists)
            .service(upsert_data_point_to_collection)
            .service(bulk_upsert_data_to_collection)
            .service(lookup_data_point)
            .service(scroll_data),
    );
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    log::info!("Starting Vector DB Proxy APP...");
    let global_data = GLOBAL_DATA.read().await;
    let _ = set_all_env_vars().await;
    let logging_level = global_data.logging_level.clone();
    let host = global_data.host.clone();
    let port = global_data.port.clone();
    // Set the default logging level
    let qdrant_client = match instantiate_qdrant_client().await {
        Ok(client) => client,
        Err(e) => {
            tracing::error!("An error occurred while trying to connect to Qdrant DB {e}");
            panic!("An error occurred while trying to connect to Qdrant DB {e}")
        }
    };
    let mongo_connection = start_mongo_connection().await.unwrap();
    let app_qdrant_client = Arc::new(RwLock::new(qdrant_client));
    let app_mongo_client = Arc::new(RwLock::new(mongo_connection));
    let qdrant_connection_for_rabbitmq = Arc::clone(&app_qdrant_client);
    let queue: Arc<RwLock<Pool<String>>> = Arc::new(RwLock::new(Pool::optimised(global_data.thread_percentage_utilisation)));
    // let redis_connection_pool: Arc<Mutex<RedisConnection>> = Arc::new(Mutex::new(redis_pool));
    let mongo_client_clone = Arc::clone(&app_mongo_client);
    let rabbitmq_connection_details = RabbitConnect {
        host: global_data.rabbitmq_host.clone(),
        port: global_data.rabbitmq_port.clone(),
        username: global_data.rabbitmq_username.clone(),
        password: global_data.rabbitmq_password.clone(),
    };
    let mut connection = connect_rabbitmq(&rabbitmq_connection_details).await;
    let mut channel = channel_rabbitmq(&connection).await;
    bind_queue_to_exchange(
        &mut connection,
        &mut channel,
        &rabbitmq_connection_details,
        &global_data.rabbitmq_exchange,
        &global_data.rabbitmq_stream,
        &global_data.rabbitmq_routing_key,
    )
        .await;
    let rabbitmq_stream = tokio::spawn(async move {
        let _ = subscribe_to_queue(
            Arc::clone(&qdrant_connection_for_rabbitmq),
            Arc::clone(&queue),
            Arc::clone(&mongo_client_clone),
            // Arc::clone(&redis_connection_pool),
            &channel,
            &global_data.rabbitmq_stream,
        )
            .await;
    });
    env_logger::Builder::from_env(Env::default().default_filter_or(logging_level)).init();
    let web_task = tokio::spawn(async move {
        log::info!("Running on http://{}:{}", host.clone(), port.clone());
        let server = HttpServer::new(move || {
            App::new()
                .wrap(Logger::default())
                .app_data(Data::new((
                    Arc::clone(&app_qdrant_client),
                    Arc::clone(&app_mongo_client),
                )))
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
