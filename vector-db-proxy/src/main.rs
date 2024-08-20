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
use pinecone_sdk::pinecone::{PineconeClient, PineconeClientConfig};
use qdrant_client::client::QdrantClient;
use tokio::signal;
use tokio::sync::RwLock;

use routes::apis::{
    bulk_upsert_data_to_collection, check_collection_exists, delete_collection,
    get_collection_info, health_check, list_collections, upsert_data_point_to_collection,
};

use crate::data::processing_incoming_messages::process_incoming_messages;
use crate::init::env_variables::set_all_env_vars;
use crate::init::env_variables::GLOBAL_DATA;
use crate::messages::models::{MessageQueue, MessageQueueProvider};
use crate::messages::tasks::get_message_queue;
use crate::routes::apis::{create_collection, get_storage_size, scroll_data};
use crate::vector_databases::vector_database::VectorDatabase;
use adaptors::mongo::client::start_mongo_connection;

mod adaptors;
mod data;
mod embeddings;
mod init;
mod messages;
mod routes;
mod utils;
mod vector_databases;

pub fn init(config: &mut web::ServiceConfig) {
    let cors = Cors::default()
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
            .service(create_collection)
            .service(upsert_data_point_to_collection)
            .service(bulk_upsert_data_to_collection)
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

    // This is to allow the use of multiple vector databases
    let vector_database_client: Arc<RwLock<dyn VectorDatabase>> =
        match global_data.vector_database.as_str() {
            "qdrant" => {
                println!("Using Qdrant Vector Database");
                let qdrant_uri = format!("{}:{}", global_data.qdrant_host, global_data.qdrant_port);
                let client = QdrantClient::from_url(qdrant_uri.as_str());
                Arc::new(RwLock::new(client.build().unwrap()))
            }
            "pinecone" => {
                println!("Using Pinecone Vector Database");
                let config = PineconeClientConfig {
                    api_key: Some("INSERT_API_KEY".to_string()),
                    control_plane_host: Some("INSERT_CONTROLLER_HOST".to_string()),
                    ..Default::default()
                };
                let pinecone: PineconeClient = config.client().expect("Failed to create Pinecone");
                Arc::new(RwLock::new(pinecone))
            }
            _ => panic!(
                "No valid vector database was chosen. Expected one of `qdrant` or `pinecone`.\
         Got `{}`",
                global_data.vector_database
            ),
        };

    let mongo_connection = start_mongo_connection().await.unwrap();
    // Create Arcs to allow sending across threads
    let app_mongo_client = Arc::new(RwLock::new(mongo_connection));

    // Clones for senders
    let vector_database_for_streaming: Arc<RwLock<dyn VectorDatabase>> =
        vector_database_client.clone();
    // Assuming
    // qdrant_client implements VectorDatabase
    let mongo_client_for_streaming = Arc::clone(&app_mongo_client);

    // Clones of the receiver and sender so that they can be sent to the right threads
    let (s, r) = channel::unbounded::<(String, String)>();
    let sender_clone = s.clone();

    // This is to allow the use of multiple message queues
    let message_queue_provider =
        MessageQueueProvider::from(global_data.message_queue_provider.clone());
    let connection = get_message_queue(message_queue_provider).await;

    // Thread to read messages from message queue and pass them to channel for processing
    let subscribe_to_message_stream = tokio::spawn(async move {
        let _ = connection
            .consume(
                connection.clone(),
                vector_database_for_streaming,
                mongo_client_for_streaming,
                sender_clone,
            )
            .await;
    });
    // Figure out how many threads are available on the machine and the percentage of those that the user would like to use when syncing data
    let number_of_workers =
        (global_data.number_of_threads * global_data.thread_percentage_utilisation) as i32;
    println!("{} threads available for work", number_of_workers);
    // Thread for receiving messages in channel and processing them across workers
    // Spawn multiple threads to process messages
    let mut handles = vec![];
    for _ in 0..(number_of_workers * 10) {
        // let receiver_clone = receiver.clone();
        let qdrant_client_clone = Arc::clone(&vector_database_client);
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
                .app_data(Data::new(Arc::clone(&vector_database_client)))
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
