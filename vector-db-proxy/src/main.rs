#![allow(dead_code)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(unused_assignments)]


use std::sync::Arc;
use std::thread;

use actix_cors::Cors;
use actix_web::{middleware::Logger, web, web::Data, App, HttpServer};
use anyhow::Context;
use crossbeam::channel;
use env_logger::Env;
use tokio::signal;
use tokio::sync::RwLock;

use adaptors::qdrant::client::instantiate_qdrant_client;
use routes::apis::{
    bulk_upsert_data_to_collection, check_collection_exists, delete_collection, get_collection_info,
    health_check, list_collections, lookup_data_point, scroll_data, upsert_data_point_to_collection,
};

use crate::data::processing_incoming_messages::process_incoming_messages;
use crate::init::env_variables::set_all_env_vars;
use crate::init::env_variables::GLOBAL_DATA;
use crate::messages::models::{MessageQueue, MessageQueueProvider};
use crate::messages::tasks::get_message_queue;
use crate::routes::apis::get_storage_size;
use adaptors::mongo::client::start_mongo_connection;

mod data;
mod errors;
mod init;
mod embeddings;
mod routes;
mod utils;
mod messages;
mod adaptors;
mod vector_dbs;

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
            .service(scroll_data)
            .service(get_collection_info)
            .service(get_storage_size),
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

    let message_queue_provider = MessageQueueProvider::from(global_data.message_queue_provider.clone());

    // Instantiate client connections
    let qdrant_client = match instantiate_qdrant_client().await {
        Ok(client) => client,
        Err(e) => {
            tracing::error!("An error occurred while trying to connect to Qdrant DB {e}");
            panic!("An error occurred while trying to connect to Qdrant DB {e}")
        }
    };
    let mongo_connection = start_mongo_connection().await.unwrap();
    // Create Arcs to allow sending across threads 
    let app_qdrant_client = Arc::new(RwLock::new(qdrant_client));
    let app_mongo_client = Arc::new(RwLock::new(mongo_connection));

    // Clones for senders
    let qdrant_connection_for_streaming = Arc::clone(&app_qdrant_client);
    let mongo_client_for_streaming = Arc::clone(&app_mongo_client);

    // Clones of the receiver and sender so that they can be sent to the right threads
    let (s, r) = channel::unbounded::<(String, String)>();
    let sender_clone = s.clone();

    let connection = get_message_queue(message_queue_provider).await;

    // Thread to read messages from message queue and pass them to channel for processing
    let subscribe_to_message_stream = tokio::spawn(async move {
        let _ = connection.consume(connection.clone(), qdrant_connection_for_streaming, mongo_client_for_streaming, sender_clone).await;
    });
    // Figure out how many threads are available on the machine and the percentage of those that the user would like to use when syncing data
    let number_of_workers = (
        global_data.number_of_threads * global_data.thread_percentage_utilisation)
        as i32;
    println!("{} threads available for work", number_of_workers);
    // Thread for receiving messages in channel and processing them across workers
    // Spawn multiple threads to process messages
    let mut handles = vec![];
    for _ in 0..(number_of_workers * 10) {
        // let receiver_clone = receiver.clone();
        let qdrant_client_clone = Arc::clone(&app_qdrant_client);
        let mongo_client_clone = Arc::clone(&app_mongo_client);
        let receiver = r.clone();
        let handle = thread::spawn(move || {
            let rt = tokio::runtime::Runtime::new().unwrap();
            rt.block_on(async {
                process_incoming_messages(receiver, qdrant_client_clone, mongo_client_clone).await;
            });
        });
        handles.push(handle);
    }


    // Set the default logging level
    env_logger::Builder::from_env(Env::default().default_filter_or(logging_level)).init();
    let web_task = tokio::spawn(async move {
        log::info!("Running on http://{}:{}", host.clone(), port.clone());
        let server = HttpServer::new(move || {
            App::new()
                .wrap(Logger::default())
                .app_data(Data::new(
                    Arc::clone(&app_qdrant_client),
                ))
                .configure(init)
        })
            .bind(format!("{}:{}", host, port))?
            .run();

        server.await.context("server error!")
    });

    tokio::select! {
        _ = web_task => log::info!("Web server task completed"),
        _ = subscribe_to_message_stream => log::info!("Message stream task completed"),
        _ = signal::ctrl_c() => {
            log::info!("Received Ctrl+C, shutting down");
        }
    }
    Ok(())
}
