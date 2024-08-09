use r2d2_redis::RedisConnectionManager;
use r2d2_redis::r2d2::Pool;
use r2d2_redis::redis::Commands;
use r2d2_redis::redis::RedisResult;
use crate::init::env_variables::GLOBAL_DATA;

pub struct RedisConnection {
    connection_pool: Pool<RedisConnectionManager>,
}


impl RedisConnection {
    pub async fn new(pool_size: Option<u32>) -> RedisResult<Self> {
        let global_data = GLOBAL_DATA.read().await;
        let pool_size = pool_size.unwrap_or(10); // Setting a default value for the pool size
        let redis_address = format!("redis://{}:{}", global_data.redis_host, global_data.redis_port);
        log::debug!("Redis Address: {redis_address}");
        let redis_connection_manager = RedisConnectionManager::new(redis_address)?;

        let connection_pool = Pool::builder().max_size(pool_size).build(redis_connection_manager).unwrap();
        Ok(RedisConnection { connection_pool })
    }
    pub fn increment_count(&self, key: &String, value: i32) -> RedisResult<()> {
        let connection = &mut self.connection_pool.get().unwrap();
        connection.incr(key, value)
    }

    pub fn check_key_exists(&self, key: &String, field: &String) -> RedisResult<String> {
        let connection = &mut self.connection_pool.get().unwrap();
        connection.hget(key, field)
    }

    pub fn set_key(&self, key: &String, field: &String, value: serde_json::value::Value) -> RedisResult<()> {
        let connection = &mut self.connection_pool.get().unwrap();
        connection.hset(key, field, serde_json::to_string(&value).unwrap())
    }
}