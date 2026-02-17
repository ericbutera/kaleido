// Trait definitions for dependency injection in auth services
//
// These traits allow the auth crate to remain independent of specific
// implementations while still providing full authentication functionality.

use async_trait::async_trait;

/// Email service for sending authentication-related emails
#[async_trait]
pub trait EmailService: Send + Sync + Clone {
    /// Send registration confirmation email
    async fn send_registration_email(
        &self,
        email: String,
        name: String,
        verification_url: String,
    );

    /// Send password reset email
    async fn send_password_reset_email(
        &self,
        email: String,
        name: String,
        reset_url: String,
        expiry_hours: i64,
    );
}

/// Cooldown/rate limiting service
#[async_trait]
pub trait CooldownManager: Send + Sync + Clone {
    /// Check if action is allowed (not in cooldown)
    async fn check_cooldown(&self, cooldown_type: CooldownType, user_id: Option<i32>) -> Result<(), CooldownError>;

    /// Update cooldown timestamp after action
    async fn update_cooldown(&self, cooldown_type: CooldownType, user_id: Option<i32>) -> Result<(), CooldownError>;

    /// Record a failed attempt
    async fn record_failure(&self, cooldown_type: CooldownType, user_id: Option<i32>) -> Result<(), CooldownError>;

    /// Reset cooldown (after successful action)
    async fn reset_cooldown(&self, cooldown_type: CooldownType, user_id: Option<i32>) -> Result<(), CooldownError>;
}

#[derive(Debug, Clone, Copy)]
pub enum CooldownType {
    Login,
    EmailResend,
    EmailForgotPassword,
}

#[derive(Debug)]
pub struct CooldownError {
    pub message: String,
    pub retry_after_seconds: Option<i64>,
}

/// Audit logging for authentication events
#[async_trait]
pub trait AuditLogger: Send + Sync + Clone {
    /// Log an authentication event
    async fn log_event(&self, event_type: AuthEventType, payload: AuthEventPayload) -> Result<(), String>;
}

#[derive(Debug, Clone)]
pub enum AuthEventType {
    LoginSucceeded,
    LoginFailed,
    Logout,
    TokenRefresh,
    TokenRefreshFailed,
    PasswordResetRequest,
    PasswordReset,
}

#[derive(Debug, Clone, Default)]
pub struct AuthEventPayload {
    pub user_id: Option<i32>,
    pub email: Option<String>,
    pub reason: Option<String>,
}

/// Metrics recording for authentication operations
pub trait MetricsRecorder: Send + Sync + Clone {
    /// Increment login counter
    fn record_login(&self);

    /// Increment failed login counter
    fn record_failed_login(&self);

    /// Increment logout counter
    fn record_logout(&self);

    /// Increment token refresh counter
    fn record_token_refresh(&self);
}

/// Configuration provider
pub trait ConfigProvider: Send + Sync + Clone {
    /// Get the frontend URL for generating email links
    fn frontend_url(&self) -> &str;

    /// Get the JWT secret for token generation
    fn jwt_secret(&self) -> &str;
}

/// No-op implementations for optional features

#[derive(Clone)]
pub struct NoOpEmailService;
#[async_trait]
impl EmailService for NoOpEmailService {
    async fn send_registration_email(&self, _: String, _: String, _: String) {}
    async fn send_password_reset_email(&self, _: String, _: String, _: String, _: i64) {}
}

#[derive(Clone)]
pub struct NoOpCooldownManager;
#[async_trait]
impl CooldownManager for NoOpCooldownManager {
    async fn check_cooldown(&self, _: CooldownType, _: Option<i32>) -> Result<(), CooldownError> {
        Ok(())
    }
    async fn update_cooldown(&self, _: CooldownType, _: Option<i32>) -> Result<(), CooldownError> {
        Ok(())
    }
    async fn record_failure(&self, _: CooldownType, _: Option<i32>) -> Result<(), CooldownError> {
        Ok(())
    }
    async fn reset_cooldown(&self, _: CooldownType, _: Option<i32>) -> Result<(), CooldownError> {
        Ok(())
    }
}

#[derive(Clone)]
pub struct NoOpAuditLogger;
#[async_trait]
impl AuditLogger for NoOpAuditLogger {
    async fn log_event(&self, _: AuthEventType, _: AuthEventPayload) -> Result<(), String> {
        Ok(())
    }
}

#[derive(Clone)]
pub struct NoOpMetricsRecorder;
impl MetricsRecorder for NoOpMetricsRecorder {
    fn record_login(&self) {}
    fn record_failed_login(&self) {}
    fn record_logout(&self) {}
    fn record_token_refresh(&self) {}
}
