use crate::error::AuthError;
// No DB usage in provider settings anymore

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

pub async fn get_provider_config(name: &str, api_url: &str) -> Result<ProviderConfig, AuthError> {
    // DB is no longer used; configuration comes from environment variables and code constants.

    // 1. Centralize redirect URL generation
    let redirect_url = format!(
        "{}/api/oauth/{}/callback",
        api_url.trim_end_matches('/'),
        name
    );

    // 2. For Google we read client id/secret from env vars; other providers are unsupported.
    if name != PROVIDER_GOOGLE {
        return Err(AuthError::internal_error(format!(
            "Unsupported provider: {name}"
        )));
    }

    // Support both GCP_ and GOOGLE_ prefixed env vars (GCP_* preferred).
    let client_id = std::env::var("GCP_OAUTH_CLIENT_ID")
        .or_else(|_| std::env::var("GOOGLE_OAUTH_CLIENT_ID"))
        .unwrap_or_default();
    let client_secret = std::env::var("GCP_OAUTH_CLIENT_SECRET")
        .or_else(|_| std::env::var("GOOGLE_OAUTH_CLIENT_SECRET"))
        .unwrap_or_default();

    // 4. Determine URLs (Google uses constants; others use DB with fallback)
    Ok(ProviderConfig {
        provider: name.to_string(),
        client_id,
        client_secret,
        redirect_url,
        auth_url: GOOGLE_AUTH_URL.to_string(),
        token_url: GOOGLE_TOKEN_URL.to_string(),
        userinfo_url: GOOGLE_USERINFO_URL.to_string(),
    })
}
