use crate::error::AppError;
use crate::models::{Game, GameStatus};
use async_trait::async_trait;
use chrono::Utc;
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct CreateGameRequest {
    pub author_id: Uuid,
    pub title: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone)]
pub struct UpdateGameStatusRequest {
    pub status: GameStatus,
    pub published_at: Option<chrono::DateTime<Utc>>,
}

#[cfg_attr(any(test, feature = "test-utils"), mockall::automock)]
#[async_trait]
pub trait GameRepository: Send + Sync {
    async fn create(&self, req: &CreateGameRequest) -> Result<Game, AppError>;
    async fn find_by_id(&self, id: Uuid) -> Result<Option<Game>, AppError>;
    /// Returns `None` if the game does not exist or its status precondition is not met.
    async fn update_status(&self, id: Uuid, req: &UpdateGameStatusRequest) -> Result<Option<Game>, AppError>;
    async fn list_published(&self, limit: i64, offset: i64) -> Result<Vec<Game>, AppError>;
}
