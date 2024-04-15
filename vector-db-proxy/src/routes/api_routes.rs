use actix_web::get;
use actix_web::http::header::ContentType;
use actix_web::web::Data;
use actix_web::*;
use actix_web_lab::extract::Path;
use std::sync::Arc;

use crate::errors::types::Result;
use crate::qdrant::helpers::{get_next_page, get_scroll_results};
use crate::qdrant::models::{CreateDisposition, MyPoint, PointSearchResults, ScrollResults};
use crate::qdrant::utils::Qdrant;
use crate::routes;
use crate::utils::conversions::convert_hashmap_to_filters;

use qdrant_client::client::QdrantClient;
use qdrant_client::prelude::*;
use qdrant_client::qdrant::{Filter, PointId, PointStruct, ScrollPoints, WithVectorsSelector};

use crate::mongo::client::start_mongo_connection;
use crate::mongo::models::Model;
use crate::mongo::queries::{get_embedding_model, get_embedding_model_and_embedding_key};
use qdrant_client::qdrant::point_id::PointIdOptions;
use qdrant_client::qdrant::with_vectors_selector::SelectorOptions;
use routes::models::{ResponseBody, SearchRequest, Status};
use serde_json::json;
use std::vec;
use mongodb::Database;
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
pub async fn list_collections(app_data: Data<(Arc<RwLock<QdrantClient>>, Arc<RwLock<Database>>)>) -> Result<impl Responder> {
    let (qdrant_conn, _) = app_data.get_ref().clone();
    let qdrant = Qdrant::new(qdrant_conn, String::from(""));
    let results = qdrant.get_list_of_collections().await?;
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
    app_data: Data<(Arc<RwLock<QdrantClient>>, Arc<RwLock<Database>>)>,
    Path(collection_name): Path<String>,
) -> Result<HttpResponse> {
    let (qdrant_conn, mongo_conn) = app_data.get_ref();
    let collection_name_clone = collection_name.clone();
    let qdrant = Qdrant::new(qdrant_conn.to_owned(), collection_name);
    let mongo = mongo_conn.read().await;
    return match get_embedding_model_and_embedding_key(&mongo, &collection_name_clone)
        .await
    {
        Ok((model_parameter_result, _)) => match model_parameter_result {
            Some(model_parameters) => {
                let vector_length = model_parameters.embeddingLength as u64;
                let embedding_model_name = model_parameters.model;
                match qdrant.check_collection_exists(
                    CreateDisposition::CreateIfNeeded,
                    Some(vector_length),
                    Some(embedding_model_name),
                )
                    .await {
                    Ok(result) => {
                        match result {
                            true => {
                                Ok(HttpResponse::Ok()
                                    .content_type(ContentType::json())
                                    .json(json!(ResponseBody {
                                    status: Status::Success,
                                    data: None,
                                    error_message: None
                                })))
                            }
                            false => {
                                Ok(HttpResponse::InternalServerError()
                                    .content_type(ContentType::json())
                                    .json(json!(ResponseBody {
                                        status: Status::Failure,
                                        data: None,
                                        error_message: Some(json!({
                                            "errorMessage": "An error occurred attempting to create collection"
                                        }))
                                    })))
                            }
                        }
                    }
                    Err(e) => {
                        Ok(HttpResponse::InternalServerError()
                            .content_type(ContentType::json())
                            .json(json!(
                        ResponseBody {
                            status: Status::Failure,
                            data: None,
                            error_message: Some(json!({
                                 "errorMessage": format!("An error occurred while checking if collection exists: {}", e)}))
                        })))
                    }
                }
            }
            None => {
                Ok(HttpResponse::InternalServerError()
                    .content_type(ContentType::json())
                    .json(json!(
                        ResponseBody {
                            status: Status::Failure,
                            data: None,
                            error_message: Some(json!({
                                "errorMessage": "Datasource has no associated models...returned None!"}))
                        })))
            }
        },
        Err(e) => {
            Ok(HttpResponse::InternalServerError()
                .content_type(ContentType::json())
                .json(json!(
                        ResponseBody {
                            status: Status::Failure,
                            data: None,
                            error_message: Some(json!({
                                 "errorMessage": format!("Model query returned an error: {}", e)}))
                        })))
        }
    };
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
#[post("/upsert-data-point/{collection_name}")]
pub async fn upsert_data_point_to_collection(
    app_data: Data<(Arc<RwLock<QdrantClient>>, Arc<RwLock<Database>>)>,
    Path(collection_name): Path<String>,
    data: web::Json<MyPoint>,
) -> Result<impl Responder> {
    let (qdrant_conn, _) = app_data.get_ref().clone();
    let points = PointStruct::new(
        data.index.to_owned(),
        data.vector.to_owned(),
        json!(data.payload).try_into().unwrap(),
    );
    let qdrant = Qdrant::new(qdrant_conn, collection_name);
    let upsert_results = qdrant.upsert_data_point_non_blocking(points).await?;
    match upsert_results {
        true => Ok(HttpResponse::Ok()
            .content_type(ContentType::json())
            .json(json!(ResponseBody {
                status: Status::Success,
                data: None,
                error_message: None
            }))),
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
    app_data: Data<(Arc<RwLock<QdrantClient>>, Arc<RwLock<Database>>)>,
    Path(collection_name): Path<String>,
    data: web::Json<Vec<MyPoint>>,
) -> Result<impl Responder> {
    let (qdrant_conn, _) = app_data.get_ref().clone();
    let mut list_of_points: Vec<PointStruct> = vec![];
    for datum in data.0 {
        let point: PointStruct = PointStruct::new(
            datum.index,
            datum.vector,
            json!(datum.payload).try_into().unwrap(),
        );
        list_of_points.push(point);
    }
    let collection_name_clone = collection_name.clone();
    let qdrant = Qdrant::new(qdrant_conn, collection_name_clone);
    let mongodb_connection = start_mongo_connection().await.unwrap();
    let collection_name_clone_2 = collection_name.clone();
    let model_parameters: Model =
        get_embedding_model(&mongodb_connection, collection_name_clone_2.as_str())
            .await
            .unwrap()
            .unwrap();
    let vector_length = model_parameters.embeddingLength as u64;
    let bulk_upsert_results = qdrant
        .bulk_upsert_data(list_of_points, Some(vector_length), None)
        .await?;
    match bulk_upsert_results {
        true => Ok(HttpResponse::Ok()
            .content_type(ContentType::json())
            .json(json!(ResponseBody {
                status: Status::Success,
                data: None,
                error_message: None
            }))),
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
#[get("/lookup-data-point/{collection_name}")]
pub async fn lookup_data_point(
    app_data: Data<(Arc<RwLock<QdrantClient>>, Arc<RwLock<Database>>)>,
    Path(collection_name): Path<String>,
    data: web::Json<SearchRequest>,
) -> Result<impl Responder> {
    let (qdrant_conn, _) = app_data.get_ref().clone();
    let qdrant_conn_lock = qdrant_conn.read().await;
    let vector = data.clone().vector.unwrap_or(vec![]).to_vec();
    let (must, must_not, should) = convert_hashmap_to_filters(&data.filters);
    let limit = data.limit.unwrap_or(3) as u64;
    let search_result = qdrant_conn_lock
        .search_points(&SearchPoints {
            collection_name,
            vector: vector.to_owned(),
            filter: Some(Filter {
                must,
                must_not,
                should,
                ..Default::default()
            }),
            limit,
            with_payload: Some(true.into()),
            ..Default::default()
        })
        .await?;
    let mut response_data: Vec<PointSearchResults> = vec![];
    for result in &search_result.result {
        let _ = response_data.push(PointSearchResults {
            score: result.score,
            payload: result.payload.to_owned(),
        });
    }
    Ok(HttpResponse::Ok()
        .content_type(ContentType::json())
        .json(json!(ResponseBody {
            status: Status::Success,
            data: Some(json!(response_data)),
            error_message: None
        })))
}

///
///
/// # Arguments
///
/// * `app_data`: Data<Arc<RwLock<QdrantClient>>>
/// * `Path(dataset_id)`:
/// * `data`: Query string parameters based on the `SearchRequest` struct
///
/// returns: Result<impl Responder<Body=<unknown>>+Sized, CustomErrorType>
///
/// # Examples
///
/// ```
///
/// ```
#[wherr]
#[get("/scroll/{dataset_id}")]
pub async fn scroll_data(
    app_data: Data<(Arc<RwLock<QdrantClient>>, Arc<RwLock<Database>>)>,
    Path(dataset_id): Path<String>,
    data: web::Query<SearchRequest>,
) -> Result<impl Responder> {
    let (qdrant_conn, _) = app_data.get_ref().clone();
    // Initialise lists
    let mut response: Vec<ScrollResults> = vec![];
    // Create a hash map of all filters provided by the client
    let (must, must_not, should) = convert_hashmap_to_filters(&data.filters);
    if qdrant_conn
        .read()
        .await
        .collection_exists(dataset_id.clone())
        .await?
        == false
    {
        log::warn!("Collection: '{}' does not exist", dataset_id);
        return Ok(HttpResponse::BadRequest()
            .content_type(ContentType::json())
            .json(json!(ResponseBody {
                status: Status::DoesNotExist,
                data: None,
                error_message: Some(json!(format!(
                    "Collection: '{}' does not exist",
                    dataset_id
                )))
            })));
    };
    // Initial scroll point query to be sent to qdrant
    let mut scroll_points = ScrollPoints {
        collection_name: dataset_id,
        filter: Some(Filter {
            must,
            must_not,
            should,
            ..Default::default()
        }),
        limit: data.limit,
        with_vectors: Some(WithVectorsSelector {
            selector_options: Some(SelectorOptions::Enable(true)),
        }),
        ..Default::default()
    };

    // Depending on whether the client has requested to return all point or not
    if let Some(get_all_pages) = data.get_all_pages {
        // Depending on whether the client provides a limit we update the scroll point limit
        if get_all_pages {
            loop {
                let qdrant_conn_clone = Arc::clone(&qdrant_conn);
                let (result, offset) = get_next_page(qdrant_conn_clone, &scroll_points).await?;
                let res = get_scroll_results(result)?;
                response.extend(res);
                if offset == "Done" {
                    break;
                }
                scroll_points.offset = Some(PointId {
                    point_id_options: Some(PointIdOptions::Uuid(offset)),
                });
            }
        } else {
            let result = qdrant_conn.read().await.scroll(&scroll_points).await?;
            response.extend(get_scroll_results(result)?);
        }
    }

    Ok(HttpResponse::Ok()
        .content_type(ContentType::json())
        .json(json!(ResponseBody {
            status: Status::Success,
            data: Some(json!({"points": response})),
            error_message: None
        })))
}

#[wherr]
#[delete("/collection/{dataset_id}")]
pub async fn delete_collection(
    app_data: Data<(Arc<RwLock<QdrantClient>>, Arc<RwLock<Database>>)>,
    Path(dataset_id): Path<String>,
) -> Result<impl Responder> {
    let dataset_id_clone = dataset_id.clone();
    let (qdrant_conn, _) = app_data.get_ref();
    let qdrant = Qdrant::new(Arc::clone(qdrant_conn), dataset_id_clone);
    match qdrant.delete_collection().await {
        Ok(()) => Ok(HttpResponse::Ok()
            .content_type(ContentType::json())
            .json(json!(ResponseBody {
                status: Status::Success,
                data: None,
                error_message: None
            }))),
        Err(e) => Ok(HttpResponse::NotFound()
            .content_type(ContentType::json())
            .json(json!(ResponseBody {
                status: Status::Failure,
                data: None,
                error_message: Some(json!({
                        "errorMessage": format!("Collection: '{}' could not be delete due to error: '{}'", dataset_id, e)
                    }))
            }))),
    }
}
