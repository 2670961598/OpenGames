use std::borrow::Cow;
use thiserror::Error;

#[derive(Debug, Clone, Error, PartialEq)]
pub enum AppError {
    #[error("resource not found")]
    NotFound,

    #[error("bad request: {0}")]
    BadRequest(Cow<'static, str>),

    #[error("validation failed: {0}")]
    Validation(Cow<'static, str>),

    #[error("authentication required")]
    Unauthorized,

    #[error("permission denied")]
    Forbidden,

    #[error("conflict: {0}")]
    Conflict(Cow<'static, str>),

    #[error("rate limited")]
    TooManyRequests,

    #[error("external service error: {0}")]
    External(Cow<'static, str>),

    #[error("internal error")]
    Internal(Cow<'static, str>),
}

impl AppError {
    pub fn bad_request(msg: impl Into<Cow<'static, str>>) -> Self {
        Self::BadRequest(msg.into())
    }

    pub fn validation(msg: impl Into<Cow<'static, str>>) -> Self {
        Self::Validation(msg.into())
    }

    pub fn conflict(msg: impl Into<Cow<'static, str>>) -> Self {
        Self::Conflict(msg.into())
    }

    pub fn external(msg: impl Into<Cow<'static, str>>) -> Self {
        Self::External(msg.into())
    }

    pub fn internal(msg: impl Into<Cow<'static, str>>) -> Self {
        Self::Internal(msg.into())
    }
}

#[cfg(feature = "axum")]
impl axum::response::IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        use axum::{http::StatusCode, Json};
        use serde_json::json;

        let status = match &self {
            AppError::NotFound => StatusCode::NOT_FOUND,
            AppError::BadRequest(_) => StatusCode::BAD_REQUEST,
            AppError::Validation(_) => StatusCode::UNPROCESSABLE_ENTITY,
            AppError::Unauthorized => StatusCode::UNAUTHORIZED,
            AppError::Forbidden => StatusCode::FORBIDDEN,
            AppError::Conflict(_) => StatusCode::CONFLICT,
            AppError::TooManyRequests => StatusCode::TOO_MANY_REQUESTS,
            AppError::External(_) => StatusCode::BAD_GATEWAY,
            AppError::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
        };

        let body = Json(json!({
            "error": self.to_string(),
            "code": status.as_u16(),
        }));

        (status, body).into_response()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_constructors() {
        assert_eq!(
            AppError::bad_request("invalid email"),
            AppError::BadRequest("invalid email".into())
        );
        assert_eq!(
            AppError::validation("password too short"),
            AppError::Validation("password too short".into())
        );
        assert_eq!(
            AppError::conflict("user already exists"),
            AppError::Conflict("user already exists".into())
        );
        assert_eq!(
            AppError::external("s3 timeout"),
            AppError::External("s3 timeout".into())
        );
        assert_eq!(
            AppError::internal("db connection lost"),
            AppError::Internal("db connection lost".into())
        );
    }

    #[test]
    fn test_error_display() {
        assert_eq!(AppError::NotFound.to_string(), "resource not found");
        assert_eq!(
            AppError::BadRequest("foo".into()).to_string(),
            "bad request: foo"
        );
        assert_eq!(
            AppError::Validation("bar".into()).to_string(),
            "validation failed: bar"
        );
        assert_eq!(AppError::Unauthorized.to_string(), "authentication required");
        assert_eq!(AppError::Forbidden.to_string(), "permission denied");
        assert_eq!(
            AppError::Conflict("baz".into()).to_string(),
            "conflict: baz"
        );
        assert_eq!(AppError::TooManyRequests.to_string(), "rate limited");
        assert_eq!(
            AppError::External("ext".into()).to_string(),
            "external service error: ext"
        );
        assert_eq!(
            AppError::Internal("int".into()).to_string(),
            "internal error"
        );
    }
}
