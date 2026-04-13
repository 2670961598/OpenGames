use async_trait::async_trait;
use og_core::{
    error::AppError,
    models::Game,
    ports::game_repository::{CreateGameRequest, GameRepository, UpdateGameStatusRequest},
};
use sqlx::PgPool;
use uuid::Uuid;

pub struct PgGameRepository {
    pool: PgPool,
}

impl PgGameRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl GameRepository for PgGameRepository {
    async fn create(&self, req: &CreateGameRequest) -> Result<Game, AppError> {
        let game = sqlx::query_as!(
            Game,
            r#"
            INSERT INTO games (author_id, title, description)
            VALUES ($1, $2, $3)
            RETURNING
                id, author_id, title, description,
                status as "status: _",
                created_at, updated_at, published_at
            "#,
            req.author_id,
            req.title,
            req.description
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => AppError::NotFound,
            _ => AppError::internal(format!("db error: {}", e)),
        })?;

        Ok(game)
    }

    async fn find_by_id(&self, id: Uuid) -> Result<Option<Game>, AppError> {
        let game = sqlx::query_as!(
            Game,
            r#"
            SELECT
                id, author_id, title, description,
                status as "status: _",
                created_at, updated_at, published_at
            FROM games
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::internal(format!("db error: {}", e)))?;

        Ok(game)
    }

    async fn update_status(&self, id: Uuid, req: &UpdateGameStatusRequest) -> Result<Option<Game>, AppError> {
        let game = sqlx::query_as!(
            Game,
            r#"
            UPDATE games
            SET status = $2, published_at = $3, updated_at = NOW()
            WHERE id = $1 AND status = 'draft'
            RETURNING
                id, author_id, title, description,
                status as "status: _",
                created_at, updated_at, published_at
            "#,
            id,
            req.status as _,
            req.published_at
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::internal(format!("db error: {}", e)))?;

        Ok(game)
    }

    async fn list_published(&self, limit: i64, offset: i64) -> Result<Vec<Game>, AppError> {
        let games = sqlx::query_as!(
            Game,
            r#"
            SELECT
                id, author_id, title, description,
                status as "status: _",
                created_at, updated_at, published_at
            FROM games
            WHERE status = 'published'
            ORDER BY published_at DESC
            LIMIT $1 OFFSET $2
            "#,
            limit,
            offset
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::internal(format!("db error: {}", e)))?;

        Ok(games)
    }
}
