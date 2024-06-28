use async_openai::Client;
use async_openai::config::OpenAIConfig;
use lazy_static::lazy_static;

lazy_static! {
        pub static ref OPENAI_CLIENT: Client<OpenAIConfig> = async_openai::Client::new();
    }


pub fn instantiate_oai_client()-> Client<OpenAIConfig>{
    let client = Client::new();
    client
}