// Authentication and authorization library for SaaS projects
//
// This crate provides:
// - User authentication (email/password, OAuth)
// - API client authentication
// - JWT token generation and validation
// - Refresh token management
// - OAuth provider integration
// - Extractors for securing routes
// - HTTP controllers/routes for auth endpoints

pub mod controllers;
pub mod cookies;
pub mod entities;
pub mod error;
pub mod extractors;
pub mod services;
pub mod tokens;
pub mod traits;

// Re-export commonly used types
pub use controllers::auth::{AuthRouteStorage, MessageResponse};
pub use controllers::routes;
pub use cookies::{clear_refresh_cookie_value, refresh_cookie_value, REFRESH_COOKIE_NAME};
pub use error::AuthError;
pub use extractors::{
    AdminUserContext, ApiClientContext, ApiClientIdentity, AuthIdentity, AuthInfo, AuthStorage,
    UserContext, UserIdentity, VerifiedUserContext,
};
pub use services::{
    api_client::{
        ApiClientCredentials, ApiClientService, ClientLoginRequest, ClientLoginResponse,
        CreateApiClientRequest,
    },
    oauth::{GoogleUserInfo, OAuthAuthorizeUrl, OAuthService},
    oauth_provider_service::OAuthProviderService,
    provider_settings::{
        get_provider_config, ProviderConfig, GOOGLE_AUTH_URL, GOOGLE_TOKEN_URL,
        GOOGLE_USERINFO_URL, PROVIDER_GOOGLE,
    },
    AuthService, ForgotPasswordRequest, LoginRequest, RegisterRequest, RegisterResponse,
    ResendConfirmationRequest, ResetPasswordRequest, TokenResponse, UserResponse,
};
pub use tokens::{
    access_token_ttl_seconds, generate_access_token, generate_api_client_access_token,
    generate_refresh_token, verify_access_token, Claims, TokenType,
};
pub use traits::{
    AuditLogger, AuthEventPayload, AuthEventType, ConfigProvider, CooldownError, CooldownManager,
    CooldownType, EmailService, MetricsRecorder, NoOpAuditLogger, NoOpCooldownManager,
    NoOpEmailService, NoOpMetricsRecorder,
};
