use async_trait::async_trait;
use og_core::{
    error::AppError,
    models::{Game, GameStatus},
    ports::game_repository::{CreateGameRequest, GameRepository, UpdateGameStatusRequest},
};
use tracing::info;
use uuid::Uuid;

#[async_trait]
pub trait GameService: Send + Sync {
    async fn create_game(&self, req: CreateGameRequest) -> Result<Game, AppError>;
    async fn publish_game(&self, game_id: Uuid, author_id: Uuid) -> Result<Game, AppError>;
    async fn get_game(&self, game_id: Uuid) -> Result<Game, AppError>;
    async fn list_published_games(&self, page: i64, page_size: i64) -> Result<Vec<Game>, AppError>;
}

pub struct GameServiceImpl<R: GameRepository> {
    repo: R,
}

impl<R: GameRepository> GameServiceImpl<R> {
    pub fn new(repo: R) -> Self {
        Self { repo }
    }
}

#[async_trait]
impl<R: GameRepository> GameService for GameServiceImpl<R> {
    async fn create_game(&self, req: CreateGameRequest) -> Result<Game, AppError> {
        info!(target: "og_service", author_id = %req.author_id, title = %req.title, "creating game");
        // Repository already returns semantic AppError; propagate unchanged.
        self.repo.create(&req).await
    }

    async fn publish_game(&self, game_id: Uuid, author_id: Uuid) -> Result<Game, AppError> {
        info!(target: "og_service", game_id = %game_id, author_id = %author_id, "publishing game");

        // TODO(auth): author_id should come from authenticated session/middleware, not client input.
        let game = self.repo.find_by_id(game_id).await?;
        let game = game.ok_or(AppError::NotFound)?;

        if game.author_id != author_id {
            return Err(AppError::Forbidden);
        }

        if game.status != GameStatus::Draft {
            return Err(AppError::Conflict(
                "only draft games can be published".into(),
            ));
        }

        let update = UpdateGameStatusRequest {
            status: GameStatus::Published,
            published_at: Some(chrono::Utc::now()),
        };

        self.repo.update_status(game_id, &update).await?
            .ok_or_else(|| AppError::conflict("game status changed concurrently"))
    }

    async fn get_game(&self, game_id: Uuid) -> Result<Game, AppError> {
        let game = self.repo.find_by_id(game_id).await?;
        game.ok_or(AppError::NotFound)
    }

    async fn list_published_games(&self, page: i64, page_size: i64) -> Result<Vec<Game>, AppError> {
        if page < 1 {
            return Err(AppError::bad_request("page must be >= 1"));
        }
        if page_size < 1 || page_size > 100 {
            return Err(AppError::bad_request("page_size must be between 1 and 100"));
        }
        let offset = (page - 1)
            .checked_mul(page_size)
            .ok_or_else(|| AppError::bad_request("page calculation overflow"))?;
        self.repo.list_published(page_size, offset).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use mockall::predicate::*;
    use og_core::ports::game_repository::MockGameRepository;
    use uuid::Uuid;

    fn dummy_game(id: Uuid, status: GameStatus) -> Game {
        Game {
            id,
            author_id: Uuid::new_v4(),
            title: "Test Game".into(),
            description: None,
            status,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            published_at: None,
        }
    }

    #[tokio::test]
    async fn test_create_game_success() {
        let mut mock = MockGameRepository::new();
        let expected = dummy_game(Uuid::new_v4(), GameStatus::Draft);
        let returned = expected.clone();

        mock.expect_create()
            .times(1)
            .returning(move |_| Ok(returned.clone()));

        let service = GameServiceImpl::<MockGameRepository>::new(mock);
        let req = CreateGameRequest {
            author_id: Uuid::new_v4(),
            title: "Test Game".into(),
            description: None,
        };

        let result = service.create_game(req).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().title, "Test Game");
    }

    #[tokio::test]
    async fn test_publish_game_success() {
        let game_id = Uuid::new_v4();
        let game = dummy_game(game_id, GameStatus::Draft);
        let author_id = game.author_id;
        let game_for_find = game.clone();

        let mut mock = MockGameRepository::new();
        mock.expect_find_by_id()
            .with(eq(game_id))
            .times(1)
            .returning(move |_| Ok(Some(game_for_find.clone())));

        mock.expect_update_status()
            .times(1)
            .returning(move |_, _| {
                let mut g = game.clone();
                g.status = GameStatus::Published;
                g.published_at = Some(Utc::now());
                Ok(Some(g))
            });

        let service = GameServiceImpl::<MockGameRepository>::new(mock);
        let result = service.publish_game(game_id, author_id).await;

        assert!(result.is_ok());
        assert_eq!(result.unwrap().status, GameStatus::Published);
    }

    #[tokio::test]
    async fn test_publish_game_not_found() {
        let game_id = Uuid::new_v4();
        let mut mock = MockGameRepository::new();
        mock.expect_find_by_id()
            .with(eq(game_id))
            .times(1)
            .returning(|_| Ok(None));

        let service = GameServiceImpl::<MockGameRepository>::new(mock);
        let result = service.publish_game(game_id, Uuid::new_v4()).await;

        assert!(matches!(result, Err(AppError::NotFound)));
    }

    #[tokio::test]
    async fn test_publish_game_race_conflict() {
        let game_id = Uuid::new_v4();
        let game = dummy_game(game_id, GameStatus::Draft);
        let author_id = game.author_id;

        let mut mock = MockGameRepository::new();
        mock.expect_find_by_id()
            .with(eq(game_id))
            .times(1)
            .returning(move |_| Ok(Some(game.clone())));

        mock.expect_update_status()
            .times(1)
            .returning(|_, _| Ok(None));

        let service = GameServiceImpl::<MockGameRepository>::new(mock);
        let result = service.publish_game(game_id, author_id).await;

        assert!(matches!(result, Err(AppError::Conflict(_))));
    }

    #[tokio::test]
    async fn test_publish_game_already_published() {
        let game_id = Uuid::new_v4();
        let game = dummy_game(game_id, GameStatus::Published);
        let author_id = game.author_id;

        let mut mock = MockGameRepository::new();
        mock.expect_find_by_id()
            .with(eq(game_id))
            .times(1)
            .returning(move |_| Ok(Some(game.clone())));

        let service = GameServiceImpl::<MockGameRepository>::new(mock);
        let result = service.publish_game(game_id, author_id).await;

        assert!(matches!(result, Err(AppError::Conflict(_))));
    }

    #[tokio::test]
    async fn test_get_game_found() {
        let game_id = Uuid::new_v4();
        let game = dummy_game(game_id, GameStatus::Published);

        let mut mock = MockGameRepository::new();
        mock.expect_find_by_id()
            .with(eq(game_id))
            .times(1)
            .returning(move |_| Ok(Some(game.clone())));

        let service = GameServiceImpl::<MockGameRepository>::new(mock);
        let result = service.get_game(game_id).await;

        assert!(result.is_ok());
        assert_eq!(result.unwrap().id, game_id);
    }

    #[tokio::test]
    async fn test_get_game_not_found() {
        let game_id = Uuid::new_v4();
        let mut mock = MockGameRepository::new();
        mock.expect_find_by_id()
            .with(eq(game_id))
            .times(1)
            .returning(|_| Ok(None));

        let service = GameServiceImpl::<MockGameRepository>::new(mock);
        let result = service.get_game(game_id).await;

        assert!(matches!(result, Err(AppError::NotFound)));
    }

    #[tokio::test]
    async fn test_list_published_games() {
        let mut mock = MockGameRepository::new();
        mock.expect_list_published()
            .with(eq(10), eq(0))
            .times(1)
            .returning(|_, _| Ok(vec![]));

        let service = GameServiceImpl::<MockGameRepository>::new(mock);
        let result = service.list_published_games(1, 10).await;

        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }

    #[tokio::test]
    async fn test_publish_game_forbidden() {
        let game_id = Uuid::new_v4();
        let game = dummy_game(game_id, GameStatus::Draft);

        let mut mock = MockGameRepository::new();
        mock.expect_find_by_id()
            .with(eq(game_id))
            .times(1)
            .returning(move |_| Ok(Some(game.clone())));

        let service = GameServiceImpl::<MockGameRepository>::new(mock);
        let result = service.publish_game(game_id, Uuid::new_v4()).await;

        assert!(matches!(result, Err(AppError::Forbidden)));
    }

    #[tokio::test]
    async fn test_list_published_games_invalid_page() {
        let mock = MockGameRepository::new();
        let service = GameServiceImpl::<MockGameRepository>::new(mock);
        let result = service.list_published_games(0, 10).await;
        assert!(matches!(result, Err(AppError::BadRequest(_))));
    }

    #[tokio::test]
    async fn test_list_published_games_invalid_page_size() {
        let mock = MockGameRepository::new();
        let service = GameServiceImpl::<MockGameRepository>::new(mock);
        let result = service.list_published_games(1, 0).await;
        assert!(matches!(result, Err(AppError::BadRequest(_))));
    }
}
