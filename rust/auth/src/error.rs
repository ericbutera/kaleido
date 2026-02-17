use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::Serialize;
use std::fmt;

/// Authentication and authorization errors
#[derive(Debug)]
pub struct AuthError {
    pub code: StatusCode,
    pub message: String,
}

impl fmt::Display for AuthError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for AuthError {}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
}

impl AuthError {
    pub fn unauthorized(message: impl Into<String>) -> Self {
        Self {
            code: StatusCode::UNAUTHORIZED,
            message: message.into(),
        }
    }

    pub fn forbidden(message: impl Into<String>) -> Self {
        Self {
            code: StatusCode::FORBIDDEN,
            message: message.into(),
        }
    }

    pub fn validation(message: impl Into<String>) -> Self {
        Self {
            code: StatusCode::UNPROCESSABLE_ENTITY,
            message: message.into(),
        }
    }

    pub fn internal_error(message: impl Into<String>) -> Self {
        Self {
            code: StatusCode::INTERNAL_SERVER_ERROR,
            message: message.into(),
        }
    }

    pub fn entity_not_found(message: impl Into<String>) -> Self {
        Self {
            code: StatusCode::NOT_FOUND,
            message: message.into(),
        }
    }
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        let body = Json(ErrorResponse {
            error: self.message,
        });
        (self.code, body).into_response()
    }
}

impl From<sea_orm::DbErr> for AuthError {
    fn from(err: sea_orm::DbErr) -> Self {
        AuthError::internal_error(format!("Database error: {}", err))
    }
}

impl From<validator::ValidationErrors> for AuthError {
    fn from(err: validator::ValidationErrors) -> Self {
        AuthError::validation(err.to_string())
    }
}

impl From<argon2::password_hash::Error> for AuthError {
    fn from(err: argon2::password_hash::Error) -> Self {
        AuthError::internal_error(format!("Password hashing error: {}", err))
    }
}

impl From<jsonwebtoken::errors::Error> for AuthError {
    fn from(err: jsonwebtoken::errors::Error) -> Self {
        AuthError::unauthorized(format!("Token error: {}", err))
    }
}
