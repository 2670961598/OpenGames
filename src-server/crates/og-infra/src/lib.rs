pub mod repository;

use og_core::config::DatabaseConfig;
use sqlx::{migrate::MigrateDatabase, PgPool, Postgres};

pub async fn init_db_pool(config: &DatabaseConfig) -> Result<PgPool, sqlx::Error> {
    if config.auto_create {
        if !Postgres::database_exists(&config.url).await? {
            Postgres::create_database(&config.url).await?;
        }
    }

    let pool = PgPool::connect(&config.url).await?;
    Ok(pool)
}
