//! This is queueing module that provides app wide capability to add tasks to a queue
use std::marker::Send;
use std::sync::Arc;
use std::collections::VecDeque;
use std::thread;
use tokio::sync::{Mutex, Notify, RwLock};
use std::thread::available_parallelism;
use mongodb::Database;
use qdrant_client::client::QdrantClient;

use crate::data::processing_incoming_messages::process_messages;
use crate::redis_rs::client::RedisConnection;

pub struct MyQueue<T> {
    q: Mutex<VecDeque<Vec<T>>>,
    max_size: usize,
    can_push: Arc<Notify>,
    can_pop: Arc<Notify>,
}

impl<T: Send + 'static> MyQueue<T> {
    fn new(max_size: usize) -> Self {
        MyQueue {
            q: Mutex::new(VecDeque::new()),
            max_size,
            can_push: Arc::new(Notify::new()),
            can_pop: Arc::new(Notify::new()),
        }
    }

    pub(crate) async fn enqueue(&self, task: Vec<T>) {
        let mut l = self.q.lock().await;
        println!("Got lock");
        while l.len() == self.max_size {
            println!("Queue is currently at capacity...please wait.");
            self.can_push.notified().await;
        }
        println!("Can push items to queue");
        l.push_back(task);
        drop(l); // Drop the lock before notifying
        self.can_pop.notify_one(); // Notify one waiting consumer task
    }

    pub async fn dequeue(&self) -> Option<Vec<T>> {
        let mut l = self.q.lock().await;
        while l.is_empty() {
            println!("Queue is currently empty...there are no items to pop");
            self.can_pop.notified().await;
        }
        println!("Popping items from queue");
        l.pop_front().map(|item: Vec<T>| {
            self.can_push.notify_one(); // Notify one waiting producer task
            item
        })
    }
    // The reason this works is that you're cloning the Arc references before they're moved into the closure, thereby satisfying Rust's lifetime requirements.
    // The closure now has ownership of the cloned Arcs, which guarantees their existence for the entire lifetime of the closure.
    // The original Arcs are still owned by the app_data object and will be dropped when app_data goes out of scope, but this won't affect the cloned Arcs.

    pub async fn embed_message(
        &mut self,
        qdrant_conn: Arc<RwLock<QdrantClient>>,
        mongo_conn: Arc<RwLock<Database>>,
        redis_conn_pool: Arc<Mutex<RedisConnection>>,
        message: String,
        datasource_id: String,
    ) {
        println!("Received table embedding task...");
        // We try and coerce T into String type, if it can't we handle the error
        let qdrant_client = Arc::clone(&qdrant_conn);
        let mongo_client = Arc::clone(&mongo_conn);
        let _ = process_messages(qdrant_client, mongo_client, redis_conn_pool, message, datasource_id).await;
    }
}

impl<T> Default for MyQueue<T> {
    fn default() -> Self {
        let number_of_threads = available_parallelism().unwrap().get();
        MyQueue {
            q: Mutex::new(VecDeque::new()),
            max_size: number_of_threads * 100,
            can_push: Arc::new(Notify::new()),
            can_pop: Arc::new(Notify::new()),
        }
    }
}



