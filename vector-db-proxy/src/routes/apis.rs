use actix_web::get;
use actix_web::http::header::ContentType;
use actix_web::web::Data;
use actix_web::*;
use actix_web_lab::extract::Path;
use std::sync::Arc;

use crate::errors::types::Result;
use crate::routes;

use crate::adaptors::mongo::client::start_mongo_connection;
use crate::adaptors::mongo::models::Model;
use crate::adaptors::mongo::queries::{get_model, get_team_datasources};
use crate::routes::models::CollectionStorageSizeResponse;
use crate::vector_dbs::models::{Point, SearchRequest, SearchType, VectorDatabaseStatus};
use crate::vector_dbs::vector_database::VectorDatabase;
use routes::models::{ResponseBody, Status};
use serde_json::json;
use std::vec;
use tokio::sync::RwLock;
use wherr::wherr;

///
///
/// # Arguments
///
/// Simple health check API for ingress
///
/// returns: Result<impl Responder<Body=<unknown>>+Sized, MyError>
///
/// # Examples
///
/// ```
///
/// ```
#[wherr]
#[get("/")]
pub async fn health_check() -> Result<impl Responder> {
    Ok(HttpResponse::Ok().finish())
}

///
///
/// # Arguments
///
/// * `app_data`: Data<Arc<RwLock<QdrantClient>>>
///
/// returns: Result<impl Responder<Body=<unknown>>+Sized, MyError>
///
/// # Examples
///
/// ```
///
/// ```
#[wherr]
#[get("/list-collections")]
pub async fn list_collections(
    app_data: Data<Arc<RwLock<dyn VectorDatabase>>>,
) -> Result<impl Responder> {
    let vector_database = app_data.get_ref().clone();
    let vector_database_client = vector_database.read().await;
    let results = vector_database_client.get_list_of_collections().await?;
    Ok(HttpResponse::Ok()
        .content_type(ContentType::json())
        .json(json!(ResponseBody {
            status: Status::Success,
            data: Some(json!({"list_of_collection": results})),
            error_message: None
        })))
}

///
///
/// # Arguments
///
/// * `app_data`: Data<Arc<RwLock<QdrantClient>>>
/// * `Path(params)`:
///
/// returns: Result<HttpResponse<BoxBody>, MyError>
///
/// # Examples
///
/// ```
///
/// ```
#[wherr]
#[post("/check-collection-exists/{collection_name}")]
pub async fn check_collection_exists(
    app_data: Data<Arc<RwLock<dyn VectorDatabase>>>,
    Path(collection_name): Path<String>,
) -> Result<HttpResponse> {
    let collection_id = collection_name.clone();
    let vector_database = app_data.get_ref().clone();
    let vector_database_client = vector_database.read().await;
    let search_request = SearchRequest::new(SearchType::Collection, collection_id);
    match vector_database_client
        .check_collection_exists(search_request)
        .await
    {
        Ok(collection_result) => match collection_result.status {
            VectorDatabaseStatus::Ok => Ok(HttpResponse::Ok()
                .content_type(ContentType::json())
                .json(json!(ResponseBody {
                    status: Status::Success,
                    data: Some(json!(collection_result.collection_metadata.unwrap())),
                    error_message: None
                }))),
            _ => Ok(HttpResponse::InternalServerError()
                .content_type(ContentType::json())
                .json(json!(ResponseBody {
                    status: Status::Failure,
                    data: None,
                    error_message: Some(json!({
                        "errorMessage": "An error occurred attempting to create collection"
                    }))
                }))),
        },
        Err(e) => Ok(HttpResponse::InternalServerError()
            .content_type(ContentType::json())
            .json(json!(ResponseBody {
                status: Status::Failure,
                data: None,
                error_message: Some(json!({
                    "errorMessage": format!("An error occurred while checking if collection \
                    exists. \
                    Error: {}", e)
                }))
            }))),
    }
}

///
///
/// # Argum,ents
///
/// * `app_data`: Data<Arc<RwLock<QdrantClient>>>
/// * `Path(collection_name)`:
/// * `data`:
///
/// returns: Result<impl Responder<Body=<unknown>>+Sized, MyError>
///
/// # Examples
///
/// ```
///
/// ```
#[wherr]
#[post("/upsert-data-point/{collection_name}")]
pub async fn upsert_data_point_to_collection(
    app_data: Data<Arc<RwLock<dyn VectorDatabase>>>,
    Path(collection_name): Path<String>,
    data: web::Json<Point>,
) -> Result<impl Responder> {
    let vector_database = app_data.get_ref().clone();
    let vector_database_client = vector_database.read().await;
    let search_request = SearchRequest::new(SearchType::Collection, collection_name);
    let upsert_results = vector_database_client
        .insert_point(search_request, data.0)
        .await?;
    match upsert_results {
        VectorDatabaseStatus::Ok => {
            Ok(HttpResponse::Ok()
                .content_type(ContentType::json())
                .json(json!(ResponseBody {
                    status: Status::Success,
                    data: None,
                    error_message: None
                })))
        }
        _ => Ok(HttpResponse::BadRequest()
            .content_type(ContentType::json())
            .json(json!(ResponseBody {
                status: Status::Success,
                data: None,
                error_message: Some(json!({
                    "errorMessage": "Point Upsert failed"
                }))
            }))),
    }
}

///
///
/// # Arguments
///
/// * `app_data`: Data<Arc<RwLock<QdrantClient>>>
/// * `Path(collection_name)`:
/// * `data`:
///
/// returns: Result<impl Responder<Body=<unknown>>+Sized, MyError>
///
/// # Examples
///
/// ```
///
/// ```
#[wherr]
#[post("/bulk-upsert-data/{collection_name}")]
pub async fn bulk_upsert_data_to_collection(
    app_data: Data<Arc<RwLock<dyn VectorDatabase>>>,
    Path(collection_name): Path<String>,
    data: web::Json<Vec<Point>>,
) -> Result<impl Responder> {
    let vector_database = app_data.get_ref().clone();
    let vector_database_client = vector_database.read().await;
    let mongodb_connection = start_mongo_connection().await?;
    let collection_name_clone_2 = collection_name.clone();
    let _model_parameters: Model = get_model(&mongodb_connection, collection_name_clone_2.as_str())
        .await?
        .unwrap();
    let search_request = SearchRequest::new(SearchType::Collection, collection_name);
    let bulk_upsert_results = vector_database_client
        .bulk_insert_points(search_request, data.0)
        .await?;
    match bulk_upsert_results {
        VectorDatabaseStatus::Ok => {
            Ok(HttpResponse::Ok()
                .content_type(ContentType::json())
                .json(json!(ResponseBody {
                    status: Status::Success,
                    data: None,
                    error_message: None
                })))
        }
        _ => Ok(HttpResponse::BadRequest()
            .content_type(ContentType::json())
            .json(json!(ResponseBody {
                status: Status::Success,
                data: None,
                error_message: Some(json!({
                    "errorMessage": "Bulk Upsert failed"
                }))
            }))),
    }
}

/////
/////
///// # Arguments
/////
///// * `app_data`: Data<Arc<RwLock<QdrantClient>>>
///// * `Path(dataset_id)`:
///// * `data`: Query string parameters based on the `SearchRequest` struct
/////
///// returns: Result<impl Responder<Body=<unknown>>+Sized, CustomErrorType>
/////
///// # Examples
/////
///// ```
/////
///// ```
#[wherr]
#[get("/scroll/{dataset_id}")]
pub async fn scroll_data(
    app_data: Data<Arc<RwLock<dyn VectorDatabase>>>,
    Path(_dataset_id): Path<String>,
    data: web::Query<SearchRequest>,
) -> Result<impl Responder> {
    let vector_database = app_data.get_ref().clone();
    let vector_database_client = vector_database.read().await;
    let results = vector_database_client.scroll_points(data.0).await.unwrap();
    Ok(HttpResponse::Ok()
        .content_type(ContentType::json())
        .json(json!(ResponseBody {
            status: Status::Success,
            data: Some(json!({"points": results})),
            error_message: None
        })))
}

#[wherr]
#[delete("/collection/{dataset_id}")]
pub async fn delete_collection(
    app_data: Data<Arc<RwLock<dyn VectorDatabase>>>,
    Path(dataset_id): Path<String>,
) -> Result<impl Responder> {
    let collection_id = dataset_id.clone();
    let vector_database = app_data.get_ref().clone();
    let vector_database_client = vector_database.read().await;
    let search_request = SearchRequest::new(SearchType::Collection, collection_id);
    match vector_database_client
        .delete_collection(search_request)
        .await
    {
        Ok(VectorDatabaseStatus::Ok) => {
            Ok(HttpResponse::Ok()
                .content_type(ContentType::json())
                .json(json!(ResponseBody {
                status: Status::Success,
                data: None,
                error_message: None
            })))
        }
        _ => {
            Ok(HttpResponse::NotFound()
                .content_type(ContentType::json())
                .json(json!(ResponseBody {
                status: Status::Failure,
                data: None,
                error_message: Some(json!({
                        "errorMessage": format!("Collection: '{}' could not be delete due to error", dataset_id)
                    }))
            })))
        }
    }
}
#[wherr]
#[get("/collection-info/{dataset_id}")]
pub async fn get_collection_info(
    app_data: Data<Arc<RwLock<dyn VectorDatabase>>>,
    Path(dataset_id): Path<String>,
) -> Result<impl Responder> {
    let collection_id = dataset_id.clone();
    let vector_database = app_data.get_ref().clone();
    let vector_database_client = vector_database.read().await;
    let search_request = SearchRequest::new(SearchType::Collection, collection_id);
    match vector_database_client.get_collection_info(search_request).await {
        Ok(Some(info)) => {
            Ok(HttpResponse::Ok()
                .content_type(ContentType::json())
                .json(json!(ResponseBody {
            status: Status::Success,
            data: Some(json!(info)),
            error_message: None
        })))
        }
        Ok(None) => {
            Ok(HttpResponse::NotFound()
                .content_type(ContentType::json())
                .json(json!(ResponseBody {
                status: Status::Failure,
                data: None,
                error_message: Some(json!({
                        "errorMessage": format!("Collection: '{}' returned no information", dataset_id)
                    }))
            })))
        }
        Err(e) => {
            Ok(HttpResponse::BadRequest()
                .content_type(ContentType::json())
                .json(json!(ResponseBody {
                status: Status::Failure,
                data: None,
                error_message: Some(json!({
                        "errorMessage": format!("Collection: '{}' could not be delete due to error: '{}'", dataset_id, e)
                    }))
        })))
        }
    }
}

#[wherr]
#[get("/storage-size/{dataset_id}")]
pub async fn get_storage_size(
    app_data: Data<Arc<RwLock<dyn VectorDatabase>>>,
    Path(team_id): Path<String>,
) -> Result<impl Responder> {
    let mut collection_size_response = CollectionStorageSizeResponse {
        list_of_datasources: vec![],
        total_size: 0.0,
        total_points: 0,
    };
    let vector_database = app_data.get_ref().clone();
    let vector_database_client = vector_database.read().await;
    let team_id = team_id.clone();
    let mongodb_connection = start_mongo_connection().await?;
    let list_of_team_datasources =
        get_team_datasources(&mongodb_connection, team_id.as_str()).await?;
    for datasource in list_of_team_datasources {
        let embedding_model = get_model(&mongodb_connection, datasource._id.to_string().as_str())
            .await?
            .unwrap();

        let search_request = SearchRequest::new(SearchType::Collection, datasource._id.to_string());
        if let Ok(Some(collection_storage_info)) = vector_database_client
            .get_storage_size(search_request, embedding_model.embeddingLength as usize)
            .await
        {
            collection_size_response.total_points += collection_storage_info.points_count.unwrap();
            collection_size_response.total_size += collection_storage_info.size.unwrap();
            collection_size_response
                .list_of_datasources
                .push(collection_storage_info);
        }
    }
    Ok(HttpResponse::Ok()
        .content_type(ContentType::json())
        .json(json!(ResponseBody {
            status: Status::Success,
            data: Some(json!(collection_size_response)),
            error_message: None
        })))
}
