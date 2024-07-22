use anyhow::anyhow;
use anyhow::Result;
use google_cloud_auth::credentials::CredentialsFile;
use google_cloud_pubsub::client::{Client, ClientConfig};
use google_cloud_pubsub::subscription::{MessageStream, SubscriptionConfig};
use google_cloud_pubsub::topic::TopicConfig;

use crate::gcp::models::PubSubConnect;
use crate::init::env_variables::GLOBAL_DATA;

pub async fn try_auth_to_google() -> Result<CredentialsFile> {
    let global_data = GLOBAL_DATA.read().await;
    println!("GOOGLE_APPLICATION_CREDENTIALS_JSON: {:?}", global_data.google_creds);
    match CredentialsFile::new().await {
        Ok(creds) => Ok(creds),
        Err(e) => {
            Err(anyhow!("There was an error authenticating to GCP. Error: {}", e))
        }
    }
}


pub async fn subscribe_to_topic(
    connection_details: PubSubConnect,
) -> Result<MessageStream> {
    // Create pubsub client.
    let cred_file = try_auth_to_google().await.unwrap();
    let client_config = ClientConfig::default().with_credentials(cred_file).await.unwrap();
    
    match Client::new(client_config).await {
        Ok(client) => {
            // Get the topic to subscribe to.
            if !client.topic(
                connection_details.topic
                    .as_str()
            ).exists(None).await? {
                println!("Topic: {} does not exist. Creating it now...", connection_details.topic.as_str());
                client.topic(connection_details.topic
                    .as_str()).create(Some(TopicConfig::default()), None).await?;
                println!("Topic: {} created successfully", connection_details.topic.as_str());
            }
            let topic = client.topic(connection_details.topic.as_str());
            // Create subscription
            let subscription = client
                .subscription(
                    connection_details.topic
                        .as_str()
                );
            if !subscription.exists(None).await? {
                println!("Subscription: {} does not exist. Creating it now...", connection_details.subscription.as_str());
                subscription.create(
                    topic
                        .fully_qualified_name(),
                    SubscriptionConfig::default(),
                    None)
                    .await?;
                println!("Subscription: {} created successfully", connection_details.subscription.as_str());
            }
            println!("Listening to messages on subscription: {}", subscription.fully_qualified_name());

            let stream = subscription
                .subscribe(None)
                .await?;
            Ok(stream)
        },
        Err(e) => Err(anyhow!("An error occurred building PubSub client. {}", e))
    }
}