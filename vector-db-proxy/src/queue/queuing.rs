//! This is queueing module that provides app wide capability to add tasks to a queue
use mongodb::Database;
use std::fmt::Debug;
use std::marker::Send;
use std::sync::Arc;
use std::thread::available_parallelism;
use tokio::sync::RwLock;

use queues::Queue;
use queues::*;
use threadpool::ThreadPool;

use qdrant_client::client::QdrantClient;

use crate::data::processing_incoming_messages::process_messages;

// This is essentially the Class
// The requirement for T to be Clone is a constraint of the queues crate
pub struct MyQueue<T: Clone> {
    q: Queue<T>,
    pool: ThreadPool,
}

// This list all the methods that are available in this class
pub trait Control<T>
    where
        T: Debug,
{
    fn new(pool_size: usize) -> Self;
    fn optimised(thread_utilisation_percentage: f64) -> Self;
    fn default() -> Self;
    fn enqueue(&mut self, task: T);
    fn embed_message(
        &mut self,
        qdrant_conn: Arc<RwLock<QdrantClient>>,
        mongo_conn: Arc<RwLock<Database>>,
        message: String,
    ) -> bool;
}

// This defines implementations of each of the methods in the class
// This implementation is generic for all types that are both Send and Clone
// T must be Send in order to be sent safely across threads
impl<T: Clone + Send> Control<T> for MyQueue<T>
    where
        T: Debug,
        String: From<T>,
{
    // This is similar to the __init__ method in python. That instantiates an instance of the class
    fn new(pool_size: usize) -> Self {
        //Here, Self is used to mean "the type that this trait is implemented for."
        MyQueue {
            q: Queue::new(),
            pool: ThreadPool::new(pool_size), // need to make this a dynamic number
        }
    }

    fn optimised(thread_utilisation_percentage: f64) -> Self {
        match available_parallelism() {
            Ok(t) => {
                println!("Threads Available: {} ", t.get());
                let threads_utilised = (t.get() as f64 * thread_utilisation_percentage) as usize;
                println!("Threads used: {}", threads_utilised);
                MyQueue {
                    q: Queue::new(),
                    pool: ThreadPool::new(threads_utilised),
                }
            }
            Err(_) => MyQueue {
                q: Queue::new(),
                pool: ThreadPool::new(1),
            },
        }
    }

    fn default() -> Self {
        match available_parallelism() {
            Ok(t) => MyQueue {
                q: Queue::new(),
                pool: ThreadPool::new(t.get()),
            },
            Err(_) => MyQueue {
                q: Queue::new(),
                pool: ThreadPool::new(1),
            },
        }
    }

    fn enqueue(&mut self, task: T) {
        match self.q.add(task) {
            Ok(_) => {}
            Err(_) => println!("Could not add task to queue"),
        };
    }

    /// The reason this works is that you're cloning the Arc references before they're moved into the closure, thereby satisfying Rust's lifetime requirements.
    /// The closure now has ownership of the cloned Arcs, which guarantees their existence for the entire lifetime of the closure.
    /// The original Arcs are still owned by the app_data object and will be dropped when app_data goes out of scope, but this won't affect the cloned Arcs.

    fn embed_message(
        &mut self,
        qdrant_conn: Arc<RwLock<QdrantClient>>,
        mongo_conn: Arc<RwLock<Database>>,
        message: String,
    ) -> bool {
        println!("Received table embedding task...");
        while self.q.size() > 0 {
            let task = match self.q.remove() {
                Ok(t) => t,
                _ => continue, //Because ! (continue) can never have a value, Rust decides that the type of guess is u32.
            };
            // We try and coerce T into String type, if it can't we handle the error
            let id = match String::try_from(task) {
                Ok(i) => i,
                Err(_) => continue,
            };
            let data = message.clone();
            let qdrant_client = Arc::clone(&qdrant_conn);
            let mongo_client = Arc::clone(&mongo_conn);
            self.pool.execute(move || {
                let rt = tokio::runtime::Runtime::new().unwrap();
                rt.block_on(async {
                    process_messages(qdrant_client, mongo_client, data, id).await;
                })
            });
        }
        true
    }
}