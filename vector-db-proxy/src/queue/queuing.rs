use mongodb::Database;
use std::fmt::Debug;
use std::marker::Send;
use std::sync::Arc;
use std::thread::available_parallelism;
use tokio::sync::RwLock;
use threadpool::ThreadPool;
use qdrant_client::client::QdrantClient;
use crossbeam::queue::SegQueue;
use crate::data::processing_incoming_messages::process_streaming_messages;

pub struct Pool<T: Clone> {
    pub q: Arc<SegQueue<T>>,
    pub pool: ThreadPool,
    pub runtime: Arc<tokio::runtime::Runtime>,
}

// This defines implementations of each of the methods in the class
// This implementation is generic for all types that are both Send and Clone
// T must be Send in order to be sent safely across threads
impl<T: Clone + Send> Pool<T>
where
    T: Debug,
    String: From<T>,
{
    pub fn new(pool_size: usize) -> Self {
        Pool {
            q: Arc::new(SegQueue::new()),
            pool: ThreadPool::new(pool_size),
            runtime: Arc::new(tokio::runtime::Runtime::new().unwrap()),
        }
    }

    pub fn optimised(thread_utilisation_percentage: f64) -> Self {
        let threads_utilised = available_parallelism()
            .map(|t| (t.get() as f64 * thread_utilisation_percentage) as usize)
            .unwrap_or(1);
        log::debug!("Threads used: {}", threads_utilised);
        Pool {
            q: Arc::new(SegQueue::new()),
            pool: ThreadPool::new(threads_utilised),
            runtime: Arc::new(tokio::runtime::Runtime::new().unwrap()),
        }
    }

    pub fn default() -> Self {
        let default_threads = available_parallelism().map(|t| t.get()).unwrap_or(1);
        Pool {
            q: Arc::new(SegQueue::new()),
            pool: ThreadPool::new(default_threads),
            runtime: Arc::new(tokio::runtime::Runtime::new().unwrap()),
        }
    }

    pub fn enqueue(&self, task: T) {
        log::debug!("Enqueueing task, current queue size before adding: {}", self.q.len());
        self.q.push(task);
        log::debug!("Task added, current queue size after adding: {}", self.q.len());
    }

    pub fn embed_message(
        &self,
        qdrant_conn: Arc<RwLock<QdrantClient>>,
        mongo_conn: Arc<RwLock<Database>>,
        message: String,
    ) {
        while !self.q.is_empty() {
            let task = match self.q.pop() {
                Some(t) => t,
                None => continue,
            };
            // We try and coerce T into String type, if it can't we handle the error
            let id = match String::try_from(task) {
                Ok(i) => i,
                Err(_) => continue,
            };
            let data = message.clone();
            let qdrant_client = Arc::clone(&qdrant_conn);
            let mongo_client = Arc::clone(&mongo_conn);
            let runtime = Arc::clone(&self.runtime);

            self.pool.execute(move || {
                runtime.block_on(async {
                    let _ = process_streaming_messages(qdrant_client, mongo_client, data, id).await;
                })
            });
        }
    }
}
