use crate::cookies::{clear_refresh_cookie_value, refresh_cookie_value, REFRESH_COOKIE_NAME};
use crate::entities::refresh_tokens;
use crate::error::AuthError;
use crate::extractors::{AuthInfo, UserContext};
use crate::services::{
    AuthService, ForgotPasswordRequest, LoginRequest, RegisterRequest, RegisterResponse,
    ResendConfirmationRequest, ResetPasswordRequest, UserResponse,
};
use crate::traits::{AuditLogger, ConfigProvider, CooldownManager, EmailService, MetricsRecorder};
use axum::body::Body;
use axum::body::Bytes;
use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::Response;
use axum::routing::{get, post};
use axum::{Json, Router};
use sea_orm::{DatabaseConnection, EntityTrait};
use std::sync::Arc;
use utoipa::ToSchema;

#[derive(serde::Serialize, serde::Deserialize, ToSchema)]
pub struct MessageResponse {
    pub message: String,
}

/// Generic storage trait for auth routes
pub trait AuthRouteStorage: Send + Sync + 'static {
    type EmailService: EmailService + Clone;
    type CooldownManager: CooldownManager + Clone;
    type AuditLogger: AuditLogger + Clone;
    type MetricsRecorder: MetricsRecorder + Clone;
    type ConfigProvider: ConfigProvider + Clone;

    fn db(&self) -> &DatabaseConnection;
    fn auth_service(
        &self,
    ) -> &AuthService<
        Self::EmailService,
        Self::CooldownManager,
        Self::AuditLogger,
        Self::MetricsRecorder,
        Self::ConfigProvider,
    >;
    fn frontend_url(&self) -> &str;
}

pub fn routes<S>() -> Router<Arc<S>>
where
    S: AuthRouteStorage + crate::extractors::AuthStorage,
{
    Router::new()
        .route("/auth/register", post(register::<S>))
        .route("/auth/login", post(login::<S>))
        .route("/auth/current", get(current::<S>))
        .route("/auth/refresh", post(refresh::<S>))
        .route("/auth/logout", get(logout::<S>))
        .route("/auth/resend-confirmation", post(resend_confirmation::<S>))
        .route("/auth/verify/:token", get(verify_email::<S>))
        .route("/auth/forgot", post(forgot_password::<S>))
        .route("/auth/reset", post(reset_password::<S>))
}

fn extract_cookie(headers: &HeaderMap, name: &str) -> Result<String, AuthError> {
    let cookies = headers
        .get(axum::http::header::COOKIE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    for cookie in cookies.split(';') {
        let cookie = cookie.trim();
        if let Some(value) = cookie.strip_prefix(&format!("{}=", name)) {
            return Ok(value.to_string());
        }
    }

    Err(AuthError::unauthorized(format!("Missing cookie: {}", name)))
}

#[utoipa::path(
    post,
    path = "/auth/register",
    request_body = RegisterRequest,
    responses(
        (status = 200, description = "User registered successfully", body = RegisterResponse),
        (status = 422, description = "Validation error")
    ),
    tag = "auth"
)]
pub async fn register<S>(
    State(state): State<Arc<S>>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Json<RegisterResponse>, AuthError>
where
    S: AuthRouteStorage,
{
    let res = state.auth_service().register(state.db(), payload).await?;
    Ok(Json(res))
}

#[utoipa::path(
    post,
    path = "/auth/login",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "Login successful"),
        (status = 401, description = "Invalid credentials"),
        (status = 422, description = "Validation error"),
        (status = 429, description = "Too many login attempts"),
    ),
    tag = "auth"
)]
pub async fn login<S>(
    State(state): State<Arc<S>>,
    Json(payload): Json<LoginRequest>,
) -> Result<Response, AuthError>
where
    S: AuthRouteStorage,
{
    let token = state.auth_service().login(state.db(), payload).await?;

    let cookie_val = refresh_cookie_value(&token.refresh_token, state.frontend_url());

    let body_bytes = serde_json::to_vec(&token)
        .map_err(|e| AuthError::internal_error(format!("Failed to serialize response: {}", e)))?;

    let response = Response::builder()
        .status(StatusCode::OK)
        .header(axum::http::header::SET_COOKIE, cookie_val)
        .header(axum::http::header::CONTENT_TYPE, "application/json")
        .body(Body::from(body_bytes))
        .map_err(|e| AuthError::internal_error(format!("Failed to build response: {}", e)))?;

    Ok(response)
}

#[utoipa::path(
    get,
    path = "/auth/current",
    responses(
        (status = 200, description = "Current user info", body = UserResponse),
        (status = 401, description = "Not authenticated")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "auth"
)]
pub async fn current<S>(
    UserContext { user, .. }: UserContext<S>,
) -> Result<Json<UserResponse>, AuthError>
where
    S: crate::extractors::AuthStorage,
{
    Ok(Json(user.into()))
}

#[utoipa::path(
    post,
    path = "/auth/refresh",
    params(),
    request_body(content = String, description = "Optional refresh token in body or cookie", content_type = "application/json"),
    responses(
        (status = 200, description = "Token refreshed successfully"),
        (status = 401, description = "Invalid refresh token")
    ),
    tag = "auth"
)]
pub async fn refresh<S>(
    State(state): State<Arc<S>>,
    headers: HeaderMap,
    body: Bytes,
) -> Result<Response, AuthError>
where
    S: AuthRouteStorage,
{
    let used_cookie = body.is_empty();
    let refresh_token = if used_cookie {
        extract_cookie(&headers, REFRESH_COOKIE_NAME)?
    } else {
        #[derive(serde::Deserialize)]
        struct RefreshRequest {
            refresh_token: String,
        }
        let rr: RefreshRequest = serde_json::from_slice(&body)
            .map_err(|_| AuthError::validation("Invalid refresh token payload"))?;
        rr.refresh_token
    };

    let token = state
        .auth_service()
        .refresh(state.db(), refresh_token)
        .await?;

    let mut builder = Response::builder().status(StatusCode::OK);
    if used_cookie {
        let cookie_val = refresh_cookie_value(&token.refresh_token, state.frontend_url());
        builder = builder.header(axum::http::header::SET_COOKIE, cookie_val);

        let user_obj = serde_json::json!({
            "pid": token.pid,
            "name": token.name,
            "email": token.email,
            "is_admin": token.is_admin,
        });
        let body = serde_json::json!({ "user": user_obj });
        let body_bytes = serde_json::to_vec(&body).map_err(|e| {
            AuthError::internal_error(format!("Failed to serialize response: {}", e))
        })?;

        let response = builder
            .header(axum::http::header::CONTENT_TYPE, "application/json")
            .body(Body::from(body_bytes))
            .map_err(|e| AuthError::internal_error(format!("Failed to build response: {}", e)))?;

        return Ok(response);
    }

    let body = serde_json::json!({ "message": "ok" });
    let body_bytes = serde_json::to_vec(&body)
        .map_err(|e| AuthError::internal_error(format!("Failed to serialize response: {}", e)))?;

    let response = builder
        .header(axum::http::header::CONTENT_TYPE, "application/json")
        .body(Body::from(body_bytes))
        .map_err(|e| AuthError::internal_error(format!("Failed to build response: {}", e)))?;

    Ok(response)
}

#[utoipa::path(
    get,
    path = "/auth/logout",
    responses(
        (status = 200, description = "Logout successful"),
        (status = 401, description = "Not authenticated")
    ),
    security(
        ("bearer_auth" = [])
    ),
    tag = "auth"
)]
pub async fn logout<S>(
    State(state): State<Arc<S>>,
    auth: AuthInfo<S>,
) -> Result<Response, AuthError>
where
    S: AuthRouteStorage + crate::extractors::AuthStorage,
{
    if let Some(refresh_token) = auth.refresh_token {
        let _ = refresh_tokens::Entity::delete_by_id(refresh_token)
            .exec(crate::extractors::AuthStorage::db(&*state))
            .await;
    } else if let Some(identity) = auth.identity {
        if let crate::extractors::AuthIdentity::User(user_identity) = identity {
            let _ = state.auth_service().logout(user_identity.user_pid).await;
        }
    }

    let cookie_val = clear_refresh_cookie_value(state.frontend_url());

    let body = serde_json::json!({ "message": "ok" });
    let body_bytes = serde_json::to_vec(&body)
        .map_err(|e| AuthError::internal_error(format!("Failed to serialize response: {}", e)))?;

    let response = Response::builder()
        .status(StatusCode::OK)
        .header(axum::http::header::SET_COOKIE, cookie_val)
        .header(axum::http::header::CONTENT_TYPE, "application/json")
        .body(Body::from(body_bytes))
        .map_err(|e| AuthError::internal_error(format!("Failed to build response: {}", e)))?;

    Ok(response)
}

#[utoipa::path(
    post,
    path = "/auth/resend-confirmation",
    request_body = ResendConfirmationRequest,
    responses(
        (status = 200, description = "Confirmation email sent", body = MessageResponse),
        (status = 422, description = "Validation error")
    ),
    tag = "auth"
)]
pub async fn resend_confirmation<S>(
    State(state): State<Arc<S>>,
    Json(payload): Json<ResendConfirmationRequest>,
) -> Result<Json<MessageResponse>, AuthError>
where
    S: AuthRouteStorage,
{
    state
        .auth_service()
        .resend_confirmation_email(state.db(), payload)
        .await?;
    Ok(Json(MessageResponse {
        message: "Confirmation email sent successfully".to_string(),
    }))
}

#[utoipa::path(
    get,
    path = "/auth/verify/{token}",
    params(
        ("token" = String, Path, description = "Email verification token")
    ),
    responses(
        (status = 200, description = "Email verified successfully", body = MessageResponse),
        (status = 422, description = "Invalid or expired token")
    ),
    tag = "auth"
)]
pub async fn verify_email<S>(
    State(state): State<Arc<S>>,
    Path(token): Path<String>,
) -> Result<Json<MessageResponse>, AuthError>
where
    S: AuthRouteStorage,
{
    state.auth_service().verify_email(state.db(), token).await?;
    Ok(Json(MessageResponse {
        message: "Email verified successfully".to_string(),
    }))
}

#[utoipa::path(
    post,
    path = "/auth/forgot",
    request_body = ForgotPasswordRequest,
    responses(
        (status = 200, description = "Password reset email sent if user exists", body = MessageResponse),
        (status = 422, description = "Validation error")
    ),
    tag = "auth"
)]
pub async fn forgot_password<S>(
    State(state): State<Arc<S>>,
    Json(payload): Json<ForgotPasswordRequest>,
) -> Result<Json<MessageResponse>, AuthError>
where
    S: AuthRouteStorage,
{
    state
        .auth_service()
        .forgot_password(state.db(), payload)
        .await?;
    Ok(Json(MessageResponse {
        message: "If the email exists, a password reset link has been sent".to_string(),
    }))
}

#[utoipa::path(
    post,
    path = "/auth/reset",
    request_body = ResetPasswordRequest,
    responses(
        (status = 200, description = "Password reset successful"),
        (status = 422, description = "Invalid or expired token")
    ),
    tag = "auth"
)]
pub async fn reset_password<S>(
    State(state): State<Arc<S>>,
    Json(payload): Json<ResetPasswordRequest>,
) -> Result<StatusCode, AuthError>
where
    S: AuthRouteStorage,
{
    state
        .auth_service()
        .reset_password(state.db(), payload)
        .await?;
    Ok(StatusCode::OK)
}
