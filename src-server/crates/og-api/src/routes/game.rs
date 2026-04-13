use axum::{
    extract::{Path, Query, State},
    routing::{get, post},
    Json, Router,
};
use validator::Validate;
use og_core::{
    error::AppError,
    models::Game,
    ports::game_repository::CreateGameRequest,
};
use og_service::game_service::GameService;
use serde::Deserialize;
use std::sync::Arc;
use uuid::Uuid;

#[derive(Debug, Deserialize, Validate)]
pub struct CreateGameBody {
    // TODO(auth): replace with authenticated user from middleware once auth is implemented.
    pub author_id: Uuid,
    #[validate(length(min = 1, max = 128))]
    pub title: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ListGamesQuery {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct PublishGameQuery {
    // TODO(auth): replace with authenticated user from middleware once auth is implemented.
    pub author_id: Uuid,
}

pub fn routes<S>(service: S) -> Router<()>
where
    S: GameService + 'static,
{
    Router::new()
        .route("/games", post(create_game::<S>).get(list_games::<S>))
        .route("/games/{id}", get(get_game::<S>))
        .route("/games/{id}/publish", post(publish_game::<S>))
        .with_state(Arc::new(service))
}

async fn create_game<S: GameService>(
    State(service): State<Arc<S>>,
    Json(body): Json<CreateGameBody>,
) -> Result<Json<Game>, AppError> {
    body.validate()
        .map_err(|e| AppError::validation(e.to_string()))?;

    let req = CreateGameRequest {
        author_id: body.author_id,
        title: body.title,
        description: body.description,
    };

    let game = service.create_game(req).await?;
    Ok(Json(game))
}

async fn get_game<S: GameService>(
    State(service): State<Arc<S>>,
    Path(id): Path<Uuid>,
) -> Result<Json<Game>, AppError> {
    let game = service.get_game(id).await?;
    Ok(Json(game))
}

async fn publish_game<S: GameService>(
    State(service): State<Arc<S>>,
    Path(id): Path<Uuid>,
    Query(query): Query<PublishGameQuery>,
) -> Result<Json<Game>, AppError> {
    let game = service.publish_game(id, query.author_id).await?;
    Ok(Json(game))
}

async fn list_games<S: GameService>(
    State(service): State<Arc<S>>,
    Query(query): Query<ListGamesQuery>,
) -> Result<Json<Vec<Game>>, AppError> {
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(20);
    let games = service.list_published_games(page, page_size).await?;
    Ok(Json(games))
}
