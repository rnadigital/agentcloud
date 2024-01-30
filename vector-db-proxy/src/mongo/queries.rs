use mongodb::bson::oid::ObjectId;
use mongodb::bson::{doc, Document};
use mongodb::error::Result as MongoResult;
use mongodb::options::FindOneOptions;
use mongodb::{Collection, Database};
use std::str::FromStr;

pub async fn get_team_id_for_datasource(
    db: Database,
    datasource_id: String,
) -> MongoResult<Document> {
    let datasources_collection: Collection<Document> = db.collection("datasources");
    let find_options = FindOneOptions::builder().sort(doc! {"teamId": 1}).build();
    let team_id = datasources_collection
        .find_one(
            doc! {"_id": ObjectId::from_str(datasource_id.as_str()).unwrap()},
            find_options,
        )
        .await?
        .unwrap();

    Ok(team_id)
}

pub async fn get_embedding_length(db: Database, datasource_id: String) -> MongoResult<Document> {
    let datasources_collection: Collection<Document> = db.collection("datasources");
    let find_options = FindOneOptions::builder()
        .sort(doc! {"embeddingLength": 1})
        .build();
    let embedding_length = datasources_collection
        .find_one(
            doc! {"_id": ObjectId::from_str(datasource_id.as_str()).unwrap()},
            find_options,
        )
        .await?
        .unwrap();

    Ok(embedding_length)
}
