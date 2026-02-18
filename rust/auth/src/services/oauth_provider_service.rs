use crate::services::provider_settings;

pub struct OAuthProviderService;

impl OAuthProviderService {
    /// Returns true when Google OAuth is configured via env vars.
    pub fn is_google_enabled() -> bool {
        std::env::var("GCP_OAUTH_CLIENT_ID").is_ok()
            && std::env::var("GCP_OAUTH_CLIENT_SECRET").is_ok()
    }

    /// If Google env vars exist, returns a `ProviderConfig` built from those values
    /// and provider constants. Returns `None` when not configured.
    pub fn google_provider_config(api_url: &str) -> Option<provider_settings::ProviderConfig> {
        if !Self::is_google_enabled() {
            return None;
        }

        let client_id = std::env::var("GCP_OAUTH_CLIENT_ID")
            .or_else(|_| std::env::var("GOOGLE_OAUTH_CLIENT_ID"))
            .unwrap_or_default();
        let client_secret = std::env::var("GCP_OAUTH_CLIENT_SECRET")
            .or_else(|_| std::env::var("GOOGLE_OAUTH_CLIENT_SECRET"))
            .unwrap_or_default();

        Some(provider_settings::ProviderConfig {
            provider: provider_settings::PROVIDER_GOOGLE.to_string(),
            client_id,
            client_secret,
            redirect_url: format!(
                "{}/api/oauth/{}/callback",
                api_url.trim_end_matches('/'),
                provider_settings::PROVIDER_GOOGLE
            ),
            auth_url: provider_settings::GOOGLE_AUTH_URL.to_string(),
            token_url: provider_settings::GOOGLE_TOKEN_URL.to_string(),
            userinfo_url: provider_settings::GOOGLE_USERINFO_URL.to_string(),
        })
    }
}
