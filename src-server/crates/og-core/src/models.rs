use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

// ========== 用户 ==========

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ========== 游戏 ==========

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "VARCHAR", rename_all = "snake_case")]
pub enum GameStatus {
    Draft,
    Published,
    Archived,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Game {
    pub id: Uuid,
    pub author_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub status: GameStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub published_at: Option<DateTime<Utc>>,
}

// ========== 游戏版本 ==========

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct GameVersion {
    pub id: Uuid,
    pub game_id: Uuid,
    pub version: String,
    pub changelog: Option<String>,
    pub storage_path: String,
    pub created_at: DateTime<Utc>,
}

// ========== 标签 ==========

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct Tag {
    pub id: Uuid,
    pub name: String,
}

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct GameTag {
    pub game_id: Uuid,
    pub tag_id: Uuid,
}

// ========== 存档 ==========

#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct UserSave {
    pub id: Uuid,
    pub user_id: Uuid,
    pub game_id: Uuid,
    pub slot: String,
    pub data: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
