use crate::error::AuthError;
use crate::services::oauth_provider_service::OAuthProviderService;
use aws_config;
use aws_sdk_secretsmanager as sm;
use sea_orm::DatabaseConnection;

/// Known provider identifiers
pub const PROVIDER_GOOGLE: &str = "google";

/// Provider-specific default endpoints
pub const GOOGLE_AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
pub const GOOGLE_TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
pub const GOOGLE_USERINFO_URL: &str = "https://www.googleapis.com/oauth2/v2/userinfo";

#[derive(Debug, Clone)]
pub struct ProviderConfig {
    pub provider: String,
    pub client_id: String,
    pub client_secret: String,
    pub redirect_url: String,
    pub auth_url: String,
    pub token_url: String,
    pub userinfo_url: String,
}

pub async fn get_provider_config(
    db: &DatabaseConnection,
    name: &str,
    api_url: &str,
) -> Result<ProviderConfig, AuthError> {
    let model = OAuthProviderService::get_by_provider(db, name).await?;

    // 1. Centralize redirect URL generation
    let redirect_url = format!(
        "{}/api/oauth/{}/callback",
        api_url.trim_end_matches('/'),
        name
    );

    // 2. Handle the case where no DB record exists
    let m = match model {
        Some(m) => m,
        None if name == PROVIDER_GOOGLE => {
            return Ok(ProviderConfig {
                provider: name.to_string(),
                client_id: String::new(),
                client_secret: String::new(),
                redirect_url,
                auth_url: GOOGLE_AUTH_URL.to_string(),
                token_url: GOOGLE_TOKEN_URL.to_string(),
                userinfo_url: GOOGLE_USERINFO_URL.to_string(),
            });
        }
        None => {
            return Err(AuthError::internal_error(format!(
                "Unsupported provider: {name}"
            )))
        }
    };

    // 3. Resolve Client Secret (AWS logic)
    let client_secret = if name == PROVIDER_GOOGLE && !m.client_secret.trim().is_empty() {
        let aws_conf = aws_config::load_from_env().await;
        let sm_client = sm::Client::new(&aws_conf);

        sm_client
            .get_secret_value()
            .secret_id(m.client_secret.clone())
            .send()
            .await
            .ok()
            .and_then(|out| out.secret_string)
            .unwrap_or_else(|| m.client_secret.clone())
    } else {
        m.client_secret.clone()
    };

    // 4. Determine URLs (Google uses constants; others use DB with fallback)
    let is_google = name == PROVIDER_GOOGLE;
    let auth_url = if is_google {
        GOOGLE_AUTH_URL.into()
    } else {
        m.auth_url.unwrap_or(GOOGLE_AUTH_URL.into())
    };
    let token_url = if is_google {
        GOOGLE_TOKEN_URL.into()
    } else {
        m.token_url.unwrap_or(GOOGLE_TOKEN_URL.into())
    };
    let userinfo_url = if is_google {
        GOOGLE_USERINFO_URL.into()
    } else {
        m.userinfo_url.unwrap_or(GOOGLE_USERINFO_URL.into())
    };

    Ok(ProviderConfig {
        provider: m.provider_name,
        client_id: m.client_id,
        client_secret,
        redirect_url,
        auth_url,
        token_url,
        userinfo_url,
    })
}
