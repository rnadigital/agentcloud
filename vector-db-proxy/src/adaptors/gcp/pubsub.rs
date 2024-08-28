use anyhow::Result;
use google_cloud_pubsub::client::{Client, ClientConfig};
use google_cloud_pubsub::subscription::{MessageStream, SubscriptionConfig};
use google_cloud_pubsub::topic::TopicConfig;

use crate::adaptors::gcp::models::PubSubConnect;

pub async fn subscribe_to_topic(connection_details: PubSubConnect) -> Result<MessageStream> {
    // Create pubsub client.
    let client_config = ClientConfig::default().with_auth().await?;
    let client = Client::new(client_config).await?;

    // Get the topic to subscribe to.
    if !client
        .topic(connection_details.topic.as_str())
        .exists(None)
        .await?
    {
        println!(
            "Topic: {} does not exist. Creating it now...",
            connection_details.topic.as_str()
        );
        client
            .topic(connection_details.topic.as_str())
            .create(Some(TopicConfig::default()), None)
            .await?;
        println!(
            "Topic: {} created successfully",
            connection_details.topic.as_str()
        );
    }
    let topic = client.topic(connection_details.topic.as_str());

    // Create subscription
    let subscription = client.subscription(connection_details.topic.as_str());
    if !subscription.exists(None).await? {
        println!(
            "Subscription: {} does not exist. Creating it now...",
            connection_details.subscription.as_str()
        );
        subscription
            .create(
                topic.fully_qualified_name(),
                SubscriptionConfig::default(),
                None,
            )
            .await?;
        println!(
            "Subscription: {} created successfully",
            connection_details.subscription.as_str()
        );
    }
    println!(
        "Listening to messages on subscription: {}",
        subscription.fully_qualified_name()
    );

    let stream = subscription.subscribe(None).await?;
    Ok(stream)
}
