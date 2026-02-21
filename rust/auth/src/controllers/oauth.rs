use crate::cookies::refresh_cookie_value;
use crate::error::AuthError;
use crate::AuthRouteStorage;
use crate::OAuthService;
use axum::{
    body::Body,
    extract::{Path, Query, State},
    http::StatusCode,
    response::Redirect,
    response::Response,
    routing::get,
    Router,
};
use serde::Deserialize;
use std::sync::Arc;
use utoipa::IntoParams;

/// Generic storage trait for OAuth routes
pub trait OAuthRouteStorage: AuthRouteStorage {
    fn api_url(&self) -> &str;
    fn oauth_enabled(&self) -> bool;
}

pub fn routes<S>() -> Router<Arc<S>>
where
    S: OAuthRouteStorage,
{
    Router::new()
        .route("/:provider", get(oauth_authorize::<S>))
        .route("/:provider/callback", get(oauth_callback::<S>))
}

/// Initiate provider OAuth flow - redirect user to provider login
#[utoipa::path(
    get,
    path = "/oauth/{provider}",
    params(
        ("provider" = String, Path, description = "OAuth provider name")
    ),
    responses(
        (status = 302, description = "Redirect to provider")
    ),
    tag = "oauth"
)]
pub async fn oauth_authorize<S>(
    State(state): State<Arc<S>>,
    Path(provider): Path<String>,
) -> Result<Redirect, AuthError>
where
    S: OAuthRouteStorage,
{
    if !state.oauth_enabled() {
        return Err(AuthError::forbidden("OAuth is disabled"));
    }
    let auth_url = OAuthService::get_authorization_url(state.db(), &provider, state.api_url())
        .await
        .map_err(|e| AuthError::internal_error(e.to_string()))?;
    tracing::debug!(provider = %provider, auth_url = %auth_url.url, "Initiating OAuth redirect");
    Ok(Redirect::temporary(&auth_url.url))
}

#[derive(Deserialize, IntoParams)]
pub struct OAuthCallbackQuery {
    code: String,
    #[allow(dead_code)]
    state: Option<String>,
}

/// Handle OAuth callback for generic provider
#[utoipa::path(
    get,
    path = "/oauth/{provider}/callback",
    params(
        ("provider" = String, Path, description = "OAuth provider name"),
        OAuthCallbackQuery
    ),
    responses(
        (status = 302, description = "Redirect to frontend")
    ),
    tag = "oauth"
)]
pub async fn oauth_callback<S>(
    State(state): State<Arc<S>>,
    Path(provider): Path<String>,
    Query(params): Query<OAuthCallbackQuery>,
) -> Result<impl axum::response::IntoResponse, AuthError>
where
    S: OAuthRouteStorage,
{
    if !state.oauth_enabled() {
        return Err(AuthError::forbidden("OAuth is disabled"));
    }
    let provider_user = OAuthService::exchange_code_and_get_user(
        state.db(),
        &provider,
        params.code,
        state.api_url(),
    )
    .await
    .map_err(|e| AuthError::internal_error(e.to_string()))?;
    let user = OAuthService::find_or_create_user(state.db(), provider_user)
        .await
        .map_err(|e| AuthError::internal_error(e.to_string()))?;

    // Convert to auth entity type
    let auth_user = crate::entities::users::Model {
        id: user.id,
        pid: user.pid,
        email: user.email.clone(),
        password: user.password.clone(),
        api_key: user.api_key.clone(),
        name: user.name.clone(),
        is_admin: user.is_admin,
        reset_token: user.reset_token.clone(),
        reset_sent_at: user.reset_sent_at,
        email_verification_token: user.email_verification_token.clone(),
        email_verification_sent_at: user.email_verification_sent_at,
        email_verified_at: user.email_verified_at,
        magic_link_token: user.magic_link_token.clone(),
        magic_link_expiration: user.magic_link_expiration,
        google_id: user.google_id.clone(),
        oauth_provider: user.oauth_provider.clone(),
        created_at: user.created_at,
        updated_at: user.updated_at,
    };

    let tokens = state
        .auth_service()
        .issue_tokens(state.db(), &auth_user)
        .await
        .map_err(AuthError::from)?;
    let frontend_url = state.frontend_url().to_string();
    let cookie_val = refresh_cookie_value(&tokens.refresh_token, &frontend_url);

    let redirect_url = format!("{}/auth/callback", frontend_url.trim_end_matches('/'));

    let response = Response::builder()
        .status(StatusCode::FOUND)
        .header(axum::http::header::LOCATION, redirect_url)
        .header(axum::http::header::SET_COOKIE, cookie_val)
        .body(Body::empty())
        .map_err(|e| {
            AuthError::internal_error(format!("Failed to build redirect response: {}", e))
        })?;

    Ok(response)
}
