use dotenv;
use std::env;
use once_cell::sync::Lazy;
use tokio::sync::RwLock;
use crate::init::models::GlobalData;

pub async fn set_all_env_vars() {
    println!("Setting Env Variables...");
    for (k, v) in dotenv::vars() {
        env::set_var(k, v)
    }
}


pub static GLOBAL_DATA: Lazy<RwLock<GlobalData>> = Lazy::new(|| {
    let data: GlobalData = GlobalData::new();
    RwLock::new(data)
});