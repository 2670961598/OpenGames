mod logging;
mod routes;
#[cfg(test)]
mod tests;

use axum::{
    routing::get,
    Json, Router,
};
use tower_http::trace::TraceLayer;
use og_core::config::AppConfig;
use og_infra::{init_db_pool, repository::pg_game_repository::PgGameRepository};
use og_service::game_service::GameServiceImpl;
use serde_json::{json, Value};
use std::net::SocketAddr;
use tracing::info;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let env = std::env::var("APP_ENV").unwrap_or_else(|_| "development".into());
    let config: AppConfig = config::Config::builder()
        .add_source(config::File::with_name(&format!("config/{}", env)))
        .add_source(config::Environment::with_prefix("APP").separator("__"))
        .build()?
        .try_deserialize()?;

    logging::init_logging(&config.logging);

    let pool = init_db_pool(&config.database).await?;
    info!(target: "og_api", "database connected");

    let game_repo = PgGameRepository::new(pool);
    let game_service = GameServiceImpl::new(game_repo);

    // Axum allows merging a Router<()> (base_routes) into a Router<Arc<S>>
    // as long as base_routes does not require any state. This is safe and compiles.
    let app = base_routes()
        .merge(routes::game::routes(game_service))
        .layer(TraceLayer::new_for_http());

    let addr: SocketAddr = format!("{}:{}", config.server.host, config.server.port).parse()?;
    info!(target: "og_api", "server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

fn base_routes() -> Router<()> {
    Router::new()
        .route("/health", get(health_handler))
        .route("/", get(root_handler))
}

async fn health_handler() -> Json<Value> {
    Json(json!({ "status": "ok" }))
}

async fn root_handler() -> Json<Value> {
    Json(json!({ "message": "OpenGames API" }))
}


