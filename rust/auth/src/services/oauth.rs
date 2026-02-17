use crate::entities::users::{self, Entity as Users};
use crate::error::AuthError;
use crate::services::provider_settings::{self, PROVIDER_GOOGLE};
use oauth2::basic::BasicClient;
use oauth2::reqwest::async_http_client;
use oauth2::AuthType;
use oauth2::{
    AuthUrl, AuthorizationCode, ClientId, ClientSecret, CsrfToken, RedirectUrl, Scope,
    TokenResponse, TokenUrl,
};
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct OAuthAuthorizeUrl {
    pub url: String,
    pub state: String,
}

#[derive(Debug, Deserialize)]
pub struct GoogleUserInfo {
    pub id: String,
    pub email: String,
    pub name: Option<String>,
    pub verified_email: bool,
}

pub struct OAuthService;

impl OAuthService {
    fn create_client_from_config(
        cfg: provider_settings::ProviderConfig,
    ) -> Result<BasicClient, AuthError> {
        let auth_url = AuthUrl::new(cfg.auth_url.clone())
            .map_err(|e| AuthError::internal_error(format!("Invalid auth URL: {}", e)))?;

        let token_url = TokenUrl::new(cfg.token_url.clone())
            .map_err(|e| AuthError::internal_error(format!("Invalid token URL: {}", e)))?;

        let redirect_url = RedirectUrl::new(cfg.redirect_url.clone())
            .map_err(|e| AuthError::internal_error(format!("Invalid redirect URL: {}", e)))?;

        tracing::debug!(redirect_url = %cfg.redirect_url, "OAuth redirect URL configured");

        Ok(BasicClient::new(
            ClientId::new(cfg.client_id),
            Some(ClientSecret::new(cfg.client_secret)),
            auth_url,
            Some(token_url),
        )
        .set_redirect_uri(redirect_url)
        // Use request-body client authentication (client_secret_post) to
        // ensure compatibility with providers that expect form-encoded body.
        .set_auth_type(AuthType::RequestBody))
    }

    /// Build an authorization URL from an explicit ProviderConfig (without reading DB).
    pub async fn build_authorization_url_from_config(
        cfg: &provider_settings::ProviderConfig,
        _db: &DatabaseConnection,
    ) -> Result<oauth2::url::Url, AuthError> {
        let client = Self::create_client_from_config(cfg.clone())?;

        let mut auth_req = client.authorize_url(CsrfToken::new_random);

        // Provider specific scopes
        if cfg.provider == PROVIDER_GOOGLE {
            auth_req = auth_req
                .add_scope(Scope::new("email".to_string()))
                .add_scope(Scope::new("profile".to_string()));
        }

        let (auth_url, _csrf_token) = auth_req.url();
        Ok(auth_url.clone())
    }

    /// Generate authorization URL for a named provider (eg. "google")
    pub async fn get_authorization_url(
        db: &DatabaseConnection,
        provider: &str,
        api_url: &str,
    ) -> Result<OAuthAuthorizeUrl, AuthError> {
        let cfg = provider_settings::get_provider_config(db, provider, api_url).await?;

        let client = Self::create_client_from_config(cfg.clone())?;

        let mut auth_req = client.authorize_url(CsrfToken::new_random);

        // Provider specific scopes
        if provider == PROVIDER_GOOGLE {
            auth_req = auth_req
                .add_scope(Scope::new("email".to_string()))
                .add_scope(Scope::new("profile".to_string()));
        }

        let (auth_url, csrf_token) = auth_req.url();

        tracing::debug!(auth_url = %auth_url.to_string(), state = %csrf_token.secret().clone(), "Generated OAuth authorization URL");

        Ok(OAuthAuthorizeUrl {
            url: auth_url.to_string(),
            state: csrf_token.secret().clone(),
        })
    }

    /// Exchange authorization code for access token and get user info for a provider.
    /// Currently only Google is implemented.
    pub async fn exchange_code_and_get_user(
        db: &DatabaseConnection,
        provider: &str,
        code: String,
        api_url: &str,
    ) -> Result<GoogleUserInfo, AuthError> {
        let cfg = provider_settings::get_provider_config(db, provider, api_url).await?;
        let client = Self::create_client_from_config(cfg.clone())?;

        // Exchange the code for an access token
        let token_result = client
            .exchange_code(AuthorizationCode::new(code))
            .request_async(async_http_client)
            .await
            .map_err(|e| AuthError::internal_error(format!("Token exchange failed: {}", e)))?;

        // Currently only Google userinfo shape is supported
        let user_info: GoogleUserInfo = reqwest::Client::new()
            .get(&cfg.userinfo_url)
            .bearer_auth(token_result.access_token().secret())
            .send()
            .await
            .map_err(|e| AuthError::internal_error(format!("Failed to fetch user info: {}", e)))?
            .json()
            .await
            .map_err(|e| AuthError::internal_error(format!("Failed to parse user info: {}", e)))?;

        if !user_info.verified_email {
            return Err(AuthError::validation("Email not verified by provider"));
        }

        Ok(user_info)
    }

    /// Find or create user from Google OAuth (keeps previous behaviour)
    pub async fn find_or_create_user(
        db: &DatabaseConnection,
        google_user: GoogleUserInfo,
    ) -> Result<users::Model, AuthError> {
        // First, try to find user by google_id
        if let Some(user) = Users::find()
            .filter(users::Column::GoogleId.eq(&google_user.id))
            .one(db)
            .await
            .map_err(|e| AuthError::internal_error(format!("Database error: {}", e)))?
        {
            return Ok(user);
        }

        // Second, try to find user by email and link Google account
        if let Some(mut user) = Users::find()
            .filter(users::Column::Email.eq(&google_user.email))
            .one(db)
            .await
            .map_err(|e| AuthError::internal_error(format!("Database error: {}", e)))?
        {
            // Link Google account to existing user
            let mut active_user: users::ActiveModel = user.clone().into();
            active_user.google_id = Set(Some(google_user.id));
            active_user.oauth_provider = Set(Some(PROVIDER_GOOGLE.to_string()));

            user = active_user
                .update(db)
                .await
                .map_err(|e| AuthError::internal_error(format!("Failed to update user: {}", e)))?;

            return Ok(user);
        }

        // Create new user with Google account
        let new_user = users::ActiveModel {
            pid: Set(Uuid::new_v4()),
            email: Set(google_user.email.clone()),
            password: Set(None), // OAuth users don't have a password
            google_id: Set(Some(google_user.id)),
            oauth_provider: Set(Some(PROVIDER_GOOGLE.to_string())),
            name: Set(google_user
                .name
                .unwrap_or_else(|| google_user.email.clone())),
            email_verified_at: Set(Some(chrono::Utc::now())), // provider verified the email
            api_key: Set(Uuid::new_v4().to_string()),
            ..Default::default()
        };

        let user = new_user
            .insert(db)
            .await
            .map_err(|e| AuthError::internal_error(format!("Failed to create user: {}", e)))?;

        Ok(user)
    }
}
