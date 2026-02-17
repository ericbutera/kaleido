// Authentication services with dependency injection
//
// Services are parameterized with trait implementations for email,
// cooldown, audit logging, metrics, and configuration, making them
// reusable across different SaaS applications.

pub mod api_client;
pub mod oauth;
pub mod oauth_provider_service;
pub mod provider_settings;

use crate::entities::{refresh_tokens, users};
use crate::error::AuthError;
use crate::tokens::generate_access_token;
use crate::traits::{
    AuditLogger, AuthEventPayload, AuthEventType, ConfigProvider, CooldownManager, CooldownType,
    EmailService, MetricsRecorder,
};
use argon2::password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;
use chrono::Utc;
use rand::rngs::OsRng;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, NotSet, QueryFilter, Set,
};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;
use validator::Validate;

pub struct RefreshToken {
    pub token: String,
    pub expires_at: i64,
}

const MIN_PASSWORD_LENGTH: u64 = 6;

#[derive(Deserialize, Validate, Debug, Clone, ToSchema)]
pub struct RegisterRequest {
    #[validate(email(message = "invalid email"))]
    pub email: String,
    #[validate(length(
        min = 1,
        max = 255,
        message = "Name must be between 1 and 255 characters"
    ))]
    pub name: String,
    #[validate(length(min = MIN_PASSWORD_LENGTH, message = "Password must be at least 6 characters"))]
    pub password: String,
}

impl RegisterRequest {
    pub fn into_active_model(self, password_hash: String) -> users::ActiveModel {
        let pid = Uuid::new_v4();
        let api_key = Uuid::new_v4().to_string();
        let email_verification_token = Uuid::new_v4().to_string();

        users::ActiveModel {
            id: NotSet,
            pid: Set(pid),
            email: Set(self.email),
            password: Set(Some(password_hash)),
            api_key: Set(api_key),
            name: Set(self.name),
            is_admin: Set(Some(false)),
            reset_token: Set(None),
            reset_sent_at: Set(None),
            email_verification_token: Set(Some(email_verification_token)),
            email_verification_sent_at: Set(Some(Utc::now())),
            email_verified_at: Set(None),
            magic_link_token: Set(None),
            magic_link_expiration: Set(None),
            google_id: Set(None),
            oauth_provider: Set(None),
            ..Default::default()
        }
    }
}

#[derive(Deserialize, Validate, Debug, Clone, ToSchema)]
pub struct LoginRequest {
    #[validate(email(message = "invalid email"))]
    pub email: String,
    #[validate(length(min = MIN_PASSWORD_LENGTH, message = "Password must be at least 6 characters"))]
    pub password: String,
}

#[derive(Serialize, Debug, Clone, ToSchema)]
pub struct TokenResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub pid: String,
    pub name: String,
    pub email: String,
    pub is_admin: bool,
}

#[derive(Serialize, ToSchema)]
pub struct RegisterResponse {
    pub pid: String,
}

#[derive(Deserialize, Validate, Debug, Clone, ToSchema)]
pub struct ResendConfirmationRequest {
    #[validate(email(message = "invalid email"))]
    pub email: String,
}

#[derive(Deserialize, Validate, Debug, Clone, ToSchema)]
pub struct ForgotPasswordRequest {
    #[validate(email(message = "invalid email"))]
    pub email: String,
}

#[derive(Deserialize, Validate, Debug, Clone, ToSchema)]
pub struct ResetPasswordRequest {
    #[validate(length(min = 1, message = "Token is required"))]
    pub token: String,
    #[validate(length(min = MIN_PASSWORD_LENGTH, message = "Password must be at least 6 characters"))]
    pub password: String,
}

#[derive(Clone, Debug, Serialize, ToSchema)]
pub struct UserResponse {
    pub pid: String,
    pub name: String,
    pub email: String,
    pub is_admin: bool,
    pub verified: bool,
}

impl From<users::Model> for UserResponse {
    fn from(m: users::Model) -> Self {
        Self {
            pid: m.pid.to_string(),
            name: m.name,
            email: m.email,
            is_admin: m.is_admin.unwrap_or(false),
            verified: m.email_verified_at.is_some(),
        }
    }
}

/// Authentication service with dependency injection
///
/// Generic parameters allow different implementations of core services
#[derive(Clone)]
pub struct AuthService<E, C, A, M, F>
where
    E: EmailService,
    C: CooldownManager,
    A: AuditLogger,
    M: MetricsRecorder,
    F: ConfigProvider,
{
    email: E,
    cooldown: C,
    audit: A,
    metrics: M,
    config: F,
}

impl<E, C, A, M, F> AuthService<E, C, A, M, F>
where
    E: EmailService,
    C: CooldownManager,
    A: AuditLogger,
    M: MetricsRecorder,
    F: ConfigProvider,
{
    pub fn new(email: E, cooldown: C, audit: A, metrics: M, config: F) -> Self {
        Self {
            email,
            cooldown,
            audit,
            metrics,
            config,
        }
    }

    fn argon2<'a>() -> Argon2<'a> {
        Argon2::default()
    }

    pub async fn register(
        &self,
        db: &DatabaseConnection,
        payload: RegisterRequest,
    ) -> Result<RegisterResponse, AuthError> {
        payload.validate()?;

        let email = payload.email.clone();
        let name = payload.name.clone();
        let password_hash = Self::hash_password(payload.password.clone()).await?;

        let am = payload.into_active_model(password_hash);

        let res = am.insert(db).await.map_err(|e| {
            // Check for unique constraint violation on email
            if let sea_orm::DbErr::Exec(sea_orm::RuntimeErr::SqlxError(sqlx_err)) = &e {
                if let Some(db_err) = sqlx_err.as_database_error() {
                    if let Some(constraint) = db_err.constraint() {
                        if constraint.contains("email") {
                            return AuthError::validation("This email is already registered");
                        }
                    }
                }
            }
            AuthError::from(e)
        })?;

        // Generate verification URL
        let verification_token = res.email_verification_token.clone().unwrap();
        let verification_url = format!(
            "{}/verify?token={}",
            self.config.frontend_url(),
            verification_token
        );

        // Send registration email asynchronously
        self.email
            .send_registration_email(email, name, verification_url)
            .await;

        Ok(RegisterResponse {
            pid: res.pid.to_string(),
        })
    }

    pub async fn verify_email(
        &self,
        db: &DatabaseConnection,
        token: String,
    ) -> Result<(), AuthError> {
        let user = users::Entity::find()
            .filter(users::Column::EmailVerificationToken.eq(token))
            .one(db)
            .await?
            .ok_or_else(|| AuthError::validation("Invalid or expired verification token"))?;

        if user.email_verified_at.is_some() {
            return Err(AuthError::validation("Email already verified"));
        }

        // Check if token is expired (24 hours)
        if let Some(sent_at) = user.email_verification_sent_at {
            let expiry_time = sent_at + chrono::Duration::hours(24);
            if Utc::now() > expiry_time {
                return Err(AuthError::validation("Verification token has expired"));
            }
        } else {
            return Err(AuthError::validation("Invalid verification token"));
        }

        let mut user_am: users::ActiveModel = user.into();
        user_am.email_verified_at = Set(Some(Utc::now()));
        user_am.email_verification_token = Set(None);
        user_am.update(db).await?;

        Ok(())
    }

    pub async fn resend_confirmation_email(
        &self,
        db: &DatabaseConnection,
        payload: ResendConfirmationRequest,
    ) -> Result<(), AuthError> {
        payload.validate()?;

        let user = match users::Model::find_by_email(db, &payload.email).await? {
            Some(u) => u,
            None => return Ok(()), // Silently succeed to prevent user enumeration
        };

        if user.email_verified_at.is_some() {
            return Err(AuthError::validation("Email already verified".to_string()));
        }

        // Check cooldown
        self.cooldown
            .check_cooldown(CooldownType::EmailResend, Some(user.id))
            .await
            .map_err(|e| AuthError::validation(e.message))?;

        let new_token = Uuid::new_v4().to_string();

        let mut user_am: users::ActiveModel = user.clone().into();
        user_am.email_verification_token = Set(Some(new_token.clone()));
        user_am.email_verification_sent_at = Set(Some(Utc::now()));
        user_am.update(db).await?;

        let verification_url = format!("{}/verify?token={}", self.config.frontend_url(), new_token);

        self.email
            .send_registration_email(user.email.clone(), user.name.clone(), verification_url)
            .await;

        self.cooldown
            .update_cooldown(CooldownType::EmailResend, Some(user.id))
            .await
            .map_err(|e| AuthError::validation(e.message))?;

        Ok(())
    }

    pub async fn forgot_password(
        &self,
        db: &DatabaseConnection,
        payload: ForgotPasswordRequest,
    ) -> Result<(), AuthError> {
        payload.validate()?;

        let user = match users::Model::find_by_email(db, &payload.email).await? {
            Some(u) => u,
            None => return Ok(()), // Silently succeed to prevent user enumeration
        };

        // Check cooldown
        self.cooldown
            .check_cooldown(CooldownType::EmailForgotPassword, Some(user.id))
            .await
            .map_err(|e| AuthError::validation(e.message))?;

        let reset_token = Uuid::new_v4().to_string();

        let mut user_am: users::ActiveModel = user.clone().into();
        user_am.reset_token = Set(Some(reset_token.clone()));
        user_am.reset_sent_at = Set(Some(Utc::now()));
        user_am.update(db).await?;

        let reset_url = format!("{}/reset?token={}", self.config.frontend_url(), reset_token);

        self.email
            .send_password_reset_email(user.email.clone(), user.name.clone(), reset_url, 24)
            .await;

        self.cooldown
            .update_cooldown(CooldownType::EmailForgotPassword, Some(user.id))
            .await
            .map_err(|e| AuthError::validation(e.message))?;

        let _ = self
            .audit
            .log_event(
                AuthEventType::PasswordResetRequest,
                AuthEventPayload {
                    user_id: Some(user.id),
                    email: Some(user.email.clone()),
                    ..Default::default()
                },
            )
            .await;

        Ok(())
    }

    pub async fn reset_password(
        &self,
        db: &DatabaseConnection,
        payload: ResetPasswordRequest,
    ) -> Result<(), AuthError> {
        payload.validate()?;

        let user = users::Model::find_by_reset_token(db, &payload.token).await?;

        let password_hash = Self::hash_password(payload.password).await?;

        let mut user_am: users::ActiveModel = user.clone().into();
        user_am.password = Set(Some(password_hash));
        user_am.reset_token = Set(None);
        user_am.reset_sent_at = Set(None);
        user_am.update(db).await?;

        let _ = self
            .audit
            .log_event(
                AuthEventType::PasswordReset,
                AuthEventPayload {
                    user_id: Some(user.id),
                    email: Some(user.email),
                    ..Default::default()
                },
            )
            .await;

        Ok(())
    }

    pub async fn login(
        &self,
        db: &DatabaseConnection,
        payload: LoginRequest,
    ) -> Result<TokenResponse, AuthError> {
        payload.validate()?;

        let user = users::Model::find_by_email(db, &payload.email)
            .await?
            .ok_or_else(|| AuthError::unauthorized("Unauthorized"))?;

        // Check cooldown
        self.cooldown
            .check_cooldown(CooldownType::Login, Some(user.id))
            .await
            .map_err(|e| AuthError::validation(e.message))?;

        // Check if user has a password (not OAuth-only user)
        let password_hash_str = user.password.clone().ok_or_else(|| {
            AuthError::unauthorized("This account uses OAuth login. Please use OAuth sign-in.")
        })?;

        let pw = payload.password.clone();
        if let Err(e) = Self::verify_password(pw, password_hash_str.clone()).await {
            let _ = self
                .cooldown
                .record_failure(CooldownType::Login, Some(user.id))
                .await;

            let _ = self
                .audit
                .log_event(
                    AuthEventType::LoginFailed,
                    AuthEventPayload {
                        user_id: Some(user.id),
                        email: Some(user.email.clone()),
                        ..Default::default()
                    },
                )
                .await;

            self.metrics.record_failed_login();
            return Err(e);
        }

        let resp = self.issue_tokens(db, &user).await?;

        let _ = self
            .audit
            .log_event(
                AuthEventType::LoginSucceeded,
                AuthEventPayload {
                    user_id: Some(user.id),
                    ..Default::default()
                },
            )
            .await;

        self.cooldown
            .reset_cooldown(CooldownType::Login, Some(user.id))
            .await
            .map_err(|e| AuthError::validation(e.message))?;

        self.metrics.record_login();
        Ok(resp)
    }

    pub async fn refresh(
        &self,
        db: &DatabaseConnection,
        refresh_token: String,
    ) -> Result<TokenResponse, AuthError> {
        let db_token_opt = refresh_tokens::Entity::find_by_id(refresh_token.clone())
            .one(db)
            .await?;

        let db_token = match db_token_opt {
            Some(t) => t,
            None => {
                let _ = self
                    .audit
                    .log_event(
                        AuthEventType::TokenRefreshFailed,
                        AuthEventPayload {
                            reason: Some("invalid_refresh_token".to_string()),
                            ..Default::default()
                        },
                    )
                    .await;

                return Err(AuthError::unauthorized("Invalid refresh token"));
            }
        };

        if db_token.expires_at < Utc::now().timestamp() {
            let _ = refresh_tokens::Entity::delete_by_id(db_token.token)
                .exec(db)
                .await;

            let _ = self
                .audit
                .log_event(
                    AuthEventType::TokenRefreshFailed,
                    AuthEventPayload {
                        reason: Some("expired".to_string()),
                        ..Default::default()
                    },
                )
                .await;

            return Err(AuthError::unauthorized("Token expired"));
        }

        let user = users::Entity::find()
            .filter(users::Column::Pid.eq(db_token.user_pid))
            .one(db)
            .await?
            .ok_or_else(|| AuthError::unauthorized("User not found"))?;

        refresh_tokens::Entity::delete_by_id(db_token.token)
            .exec(db)
            .await?;

        let resp = self.issue_tokens(db, &user).await?;

        let _ = self
            .audit
            .log_event(
                AuthEventType::TokenRefresh,
                AuthEventPayload {
                    user_id: Some(user.id),
                    email: Some(user.email.clone()),
                    ..Default::default()
                },
            )
            .await;

        self.metrics.record_token_refresh();
        Ok(resp)
    }

    pub async fn logout(&self, _pid: Uuid) -> Result<(), AuthError> {
        let _ = self
            .audit
            .log_event(AuthEventType::Logout, AuthEventPayload::default())
            .await;
        self.metrics.record_logout();
        Ok(())
    }

    async fn hash_password(password: String) -> Result<String, AuthError> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Self::argon2();
        let password_hash = argon2
            .hash_password(password.as_bytes(), &salt)?
            .to_string();
        Ok(password_hash)
    }

    async fn verify_password(password: String, hash: String) -> Result<(), AuthError> {
        let parsed_hash = PasswordHash::new(&hash)?;

        let argon2 = Self::argon2();
        argon2
            .verify_password(password.as_bytes(), &parsed_hash)
            .map_err(|_| AuthError::unauthorized("Invalid password"))
    }

    pub async fn issue_tokens(
        &self,
        db: &DatabaseConnection,
        user: &users::Model,
    ) -> Result<TokenResponse, AuthError> {
        let access_token = generate_access_token(user, self.config.jwt_secret())?;
        let refresh_token = Self::generate_refresh_token(user);

        refresh_tokens::Model::create_record(db, user.pid, &refresh_token.token).await?;

        Ok(TokenResponse {
            access_token,
            refresh_token: refresh_token.token,
            pid: user.pid.to_string(),
            name: user.name.clone(),
            email: user.email.clone(),
            is_admin: user.is_admin.unwrap_or_default(),
        })
    }

    fn generate_refresh_token(_user: &users::Model) -> RefreshToken {
        use crate::tokens::generate_refresh_token as gen_token;
        let (token, exp) = gen_token();
        RefreshToken {
            token,
            expires_at: exp,
        }
    }
}
