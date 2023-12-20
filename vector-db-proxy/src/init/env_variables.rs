use dotenv;
use log;
use std::env;

pub async fn set_all_env_vars() {
    println!("Setting Env Variables...");
    for (k, v) in dotenv::vars() {
        env::set_var(k, v)
    }
}

pub async fn get_redis_host_port() -> (String, String) {
    let host = "127.0.0.1";
    let port = "6379";
    log::info!("Running Redis locally on address: '{}:{}'", host, port);
    (host.to_string(), port.to_string())
}
