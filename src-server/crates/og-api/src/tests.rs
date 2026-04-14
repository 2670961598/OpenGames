use crate::routes;
use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use og_core::{
    error::AppError,
    models::{Game, GameStatus},
    ports::game_repository::MockGameRepository,
};
use og_service::game_service::GameServiceImpl;
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;
use mockall::predicate::*;

fn app_with_mock_service(mock: MockGameRepository) -> axum::Router {
    let service = GameServiceImpl::<MockGameRepository>::new(mock);
    routes::game::routes(service).merge(crate::base_routes())
}

#[tokio::test]
async fn test_health_returns_ok() {
    let mock = MockGameRepository::new();
    let response = app_with_mock_service(mock)
        .oneshot(Request::builder().uri("/health").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_root_returns_ok() {
    let mock = MockGameRepository::new();
    let response = app_with_mock_service(mock)
        .oneshot(Request::builder().uri("/").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_create_game_success() {
    let mut mock = MockGameRepository::new();
    let game = Game {
        id: Uuid::new_v4(),
        author_id: Uuid::new_v4(),
        title: "My Game".into(),
        description: None,
        status: GameStatus::Draft,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        published_at: None,
    };
    let returned = game.clone();

    mock.expect_create()
        .times(1)
        .returning(move |_| Ok(returned.clone()));

    let response = app_with_mock_service(mock)
        .oneshot(
            Request::builder()
                .uri("/games")
                .method("POST")
                .header("Content-Type", "application/json")
                .body(Body::from(
                    json!({
                        "author_id": game.author_id.to_string(),
                        "title": "My Game",
                        "description": null
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_create_game_validation_error() {
    let mock = MockGameRepository::new();

    let response = app_with_mock_service(mock)
        .oneshot(
            Request::builder()
                .uri("/games")
                .method("POST")
                .header("Content-Type", "application/json")
                .body(Body::from(
                    json!({
                        "author_id": Uuid::new_v4().to_string(),
                        "title": "",
                        "description": null
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNPROCESSABLE_ENTITY);
}

#[tokio::test]
async fn test_get_game_success() {
    let game_id = Uuid::new_v4();
    let mut mock = MockGameRepository::new();
    let game = Game {
        id: game_id,
        author_id: Uuid::new_v4(),
        title: "Found Game".into(),
        description: None,
        status: GameStatus::Published,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        published_at: Some(chrono::Utc::now()),
    };

    mock.expect_find_by_id()
        .with(eq(game_id))
        .times(1)
        .returning(move |_| Ok(Some(game.clone())));

    let response = app_with_mock_service(mock)
        .oneshot(
            Request::builder()
                .uri(&format!("/games/{}", game_id))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_get_game_not_found() {
    let game_id = Uuid::new_v4();
    let mut mock = MockGameRepository::new();

    mock.expect_find_by_id()
        .with(eq(game_id))
        .times(1)
        .returning(|_| Ok(None));

    let response = app_with_mock_service(mock)
        .oneshot(
            Request::builder()
                .uri(&format!("/games/{}", game_id))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_publish_game_success() {
    let game_id = Uuid::new_v4();
    let mut mock = MockGameRepository::new();
    let draft = Game {
        id: game_id,
        author_id: Uuid::new_v4(),
        title: "Draft Game".into(),
        description: None,
        status: GameStatus::Draft,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        published_at: None,
    };
    let author_id = draft.author_id;
    let draft_for_find = draft.clone();

    mock.expect_find_by_id()
        .with(eq(game_id))
        .times(1)
        .returning(move |_| Ok(Some(draft_for_find.clone())));

    mock.expect_update_status()
        .times(1)
        .returning(move |_, _| {
            let mut g = draft.clone();
            g.status = GameStatus::Published;
            g.published_at = Some(chrono::Utc::now());
            Ok(Some(g))
        });

    let response = app_with_mock_service(mock)
        .oneshot(
            Request::builder()
                .uri(&format!("/games/{}/publish?author_id={}", game_id, author_id))
                .method("POST")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_list_published_games() {
    let mut mock = MockGameRepository::new();
    mock.expect_list_published()
        .with(eq(20), eq(0))
        .times(1)
        .returning(|_, _| Ok(vec![]));

    let response = app_with_mock_service(mock)
        .oneshot(
            Request::builder()
                .uri("/games")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_publish_game_not_found() {
    let game_id = Uuid::new_v4();
    let mut mock = MockGameRepository::new();

    mock.expect_find_by_id()
        .with(eq(game_id))
        .times(1)
        .returning(|_| Ok(None));

    let response = app_with_mock_service(mock)
        .oneshot(
            Request::builder()
                .uri(&format!("/games/{}/publish?author_id={}", game_id, Uuid::new_v4()))
                .method("POST")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_publish_game_conflict() {
    let game_id = Uuid::new_v4();
    let mut mock = MockGameRepository::new();
    let game = Game {
        id: game_id,
        author_id: Uuid::new_v4(),
        title: "Published Game".into(),
        description: None,
        status: GameStatus::Published,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        published_at: Some(chrono::Utc::now()),
    };
    let author_id = game.author_id;

    mock.expect_find_by_id()
        .with(eq(game_id))
        .times(1)
        .returning(move |_| Ok(Some(game.clone())));

    let response = app_with_mock_service(mock)
        .oneshot(
            Request::builder()
                .uri(&format!("/games/{}/publish?author_id={}", game_id, author_id))
                .method("POST")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::CONFLICT);
}

#[tokio::test]
async fn test_publish_game_forbidden() {
    let game_id = Uuid::new_v4();
    let mut mock = MockGameRepository::new();
    let game = Game {
        id: game_id,
        author_id: Uuid::new_v4(),
        title: "Draft Game".into(),
        description: None,
        status: GameStatus::Draft,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
        published_at: None,
    };

    mock.expect_find_by_id()
        .with(eq(game_id))
        .times(1)
        .returning(move |_| Ok(Some(game.clone())));

    let response = app_with_mock_service(mock)
        .oneshot(
            Request::builder()
                .uri(&format!("/games/{}/publish?author_id={}", game_id, Uuid::new_v4()))
                .method("POST")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}

mod error_tests {
    use super::*;
    use axum::response::IntoResponse;

    async fn status_of(err: AppError) -> StatusCode {
        let response = err.into_response();
        response.status()
    }

    #[tokio::test]
    async fn test_not_found_maps_to_404() {
        assert_eq!(status_of(AppError::NotFound).await, StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn test_bad_request_maps_to_400() {
        assert_eq!(
            status_of(AppError::bad_request("invalid")).await,
            StatusCode::BAD_REQUEST
        );
    }

    #[tokio::test]
    async fn test_validation_maps_to_422() {
        assert_eq!(
            status_of(AppError::validation("too short")).await,
            StatusCode::UNPROCESSABLE_ENTITY
        );
    }

    #[tokio::test]
    async fn test_unauthorized_maps_to_401() {
        assert_eq!(status_of(AppError::Unauthorized).await, StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn test_forbidden_maps_to_403() {
        assert_eq!(status_of(AppError::Forbidden).await, StatusCode::FORBIDDEN);
    }

    #[tokio::test]
    async fn test_conflict_maps_to_409() {
        assert_eq!(
            status_of(AppError::conflict("already exists")).await,
            StatusCode::CONFLICT
        );
    }

    #[tokio::test]
    async fn test_too_many_requests_maps_to_429() {
        assert_eq!(status_of(AppError::TooManyRequests).await, StatusCode::TOO_MANY_REQUESTS);
    }

    #[tokio::test]
    async fn test_external_maps_to_502() {
        assert_eq!(
            status_of(AppError::external("s3 down")).await,
            StatusCode::BAD_GATEWAY
        );
    }

    #[tokio::test]
    async fn test_internal_maps_to_500() {
        assert_eq!(
            status_of(AppError::internal("db down")).await,
            StatusCode::INTERNAL_SERVER_ERROR
        );
    }
}
