use crate::traits::{CooldownError, CooldownManager, CooldownType, EmailService};
use async_trait::async_trait;
use sea_orm::DatabaseConnection;
use std::future::Future;
use std::marker::PhantomData;
use std::pin::Pin;
use std::sync::Arc;

type EmailFuture = Pin<Box<dyn Future<Output = ()> + Send + 'static>>;
type CooldownFuture = Pin<Box<dyn Future<Output = Result<(), CooldownError>> + Send + 'static>>;

#[async_trait]
pub trait EmailTaskDispatcher: Send + Sync + Clone {
    async fn send_registration_email(&self, email: String, name: String, verification_url: String);

    async fn send_password_reset_email(
        &self,
        email: String,
        name: String,
        reset_url: String,
        expiry_hours: i64,
    );
}

#[derive(Clone)]
pub struct TaskQueueEmailService<D>
where
    D: EmailTaskDispatcher,
{
    dispatcher: D,
}

impl<D> TaskQueueEmailService<D>
where
    D: EmailTaskDispatcher,
{
    pub fn new(dispatcher: D) -> Self {
        Self { dispatcher }
    }
}

#[async_trait]
impl<D> EmailService for TaskQueueEmailService<D>
where
    D: EmailTaskDispatcher,
{
    async fn send_registration_email(&self, email: String, name: String, verification_url: String) {
        self.dispatcher
            .send_registration_email(email, name, verification_url)
            .await;
    }

    async fn send_password_reset_email(
        &self,
        email: String,
        name: String,
        reset_url: String,
        expiry_hours: i64,
    ) {
        self.dispatcher
            .send_password_reset_email(email, name, reset_url, expiry_hours)
            .await;
    }
}

#[async_trait]
pub trait CooldownBackend: Send + Sync + Clone {
    async fn check_cooldown(
        &self,
        cooldown_type: CooldownType,
        user_id: Option<i32>,
    ) -> Result<(), String>;
    async fn update_cooldown(
        &self,
        cooldown_type: CooldownType,
        user_id: Option<i32>,
    ) -> Result<(), String>;
    async fn record_failure(
        &self,
        cooldown_type: CooldownType,
        user_id: Option<i32>,
    ) -> Result<(), String>;
    async fn reset_cooldown(
        &self,
        cooldown_type: CooldownType,
        user_id: Option<i32>,
    ) -> Result<(), String>;
}

#[async_trait]
pub trait CooldownBackendByType<T>: Send + Sync + Clone
where
    T: Send + Sync + Clone + 'static,
{
    async fn check_by_type(&self, cooldown_type: T, user_id: Option<i32>) -> Result<(), String>;
    async fn update_by_type(&self, cooldown_type: T, user_id: Option<i32>) -> Result<(), String>;
    async fn record_failure_by_type(
        &self,
        cooldown_type: T,
        user_id: Option<i32>,
    ) -> Result<(), String>;
    async fn reset_by_type(&self, cooldown_type: T, user_id: Option<i32>) -> Result<(), String>;
}

#[derive(Clone)]
pub struct MappedCooldownBackend<B, M, T>
where
    B: CooldownBackendByType<T>,
    M: Fn(CooldownType) -> T + Send + Sync + Clone,
    T: Send + Sync + Clone + 'static,
{
    backend: B,
    mapper: M,
    _marker: PhantomData<T>,
}

impl<B, M, T> MappedCooldownBackend<B, M, T>
where
    B: CooldownBackendByType<T>,
    M: Fn(CooldownType) -> T + Send + Sync + Clone,
    T: Send + Sync + Clone + 'static,
{
    pub fn new(backend: B, mapper: M) -> Self {
        Self {
            backend,
            mapper,
            _marker: PhantomData,
        }
    }
}

#[async_trait]
impl<B, M, T> CooldownBackend for MappedCooldownBackend<B, M, T>
where
    B: CooldownBackendByType<T>,
    M: Fn(CooldownType) -> T + Send + Sync + Clone,
    T: Send + Sync + Clone + 'static,
{
    async fn check_cooldown(
        &self,
        cooldown_type: CooldownType,
        user_id: Option<i32>,
    ) -> Result<(), String> {
        self.backend
            .check_by_type((self.mapper)(cooldown_type), user_id)
            .await
    }

    async fn update_cooldown(
        &self,
        cooldown_type: CooldownType,
        user_id: Option<i32>,
    ) -> Result<(), String> {
        self.backend
            .update_by_type((self.mapper)(cooldown_type), user_id)
            .await
    }

    async fn record_failure(
        &self,
        cooldown_type: CooldownType,
        user_id: Option<i32>,
    ) -> Result<(), String> {
        self.backend
            .record_failure_by_type((self.mapper)(cooldown_type), user_id)
            .await
    }

    async fn reset_cooldown(
        &self,
        cooldown_type: CooldownType,
        user_id: Option<i32>,
    ) -> Result<(), String> {
        self.backend
            .reset_by_type((self.mapper)(cooldown_type), user_id)
            .await
    }
}

#[derive(Clone)]
pub struct BackendCooldownManager<B>
where
    B: CooldownBackend,
{
    backend: B,
}

impl<B> BackendCooldownManager<B>
where
    B: CooldownBackend,
{
    pub fn new(backend: B) -> Self {
        Self { backend }
    }
}

#[async_trait]
impl<B> CooldownManager for BackendCooldownManager<B>
where
    B: CooldownBackend,
{
    async fn check_cooldown(
        &self,
        cooldown_type: CooldownType,
        user_id: Option<i32>,
    ) -> Result<(), CooldownError> {
        self.backend
            .check_cooldown(cooldown_type, user_id)
            .await
            .map_err(|message| CooldownError {
                message,
                retry_after_seconds: None,
            })
    }

    async fn update_cooldown(
        &self,
        cooldown_type: CooldownType,
        user_id: Option<i32>,
    ) -> Result<(), CooldownError> {
        self.backend
            .update_cooldown(cooldown_type, user_id)
            .await
            .map_err(|message| CooldownError {
                message,
                retry_after_seconds: None,
            })
    }

    async fn record_failure(
        &self,
        cooldown_type: CooldownType,
        user_id: Option<i32>,
    ) -> Result<(), CooldownError> {
        self.backend
            .record_failure(cooldown_type, user_id)
            .await
            .map_err(|message| CooldownError {
                message,
                retry_after_seconds: None,
            })
    }

    async fn reset_cooldown(
        &self,
        cooldown_type: CooldownType,
        user_id: Option<i32>,
    ) -> Result<(), CooldownError> {
        self.backend
            .reset_cooldown(cooldown_type, user_id)
            .await
            .map_err(|message| CooldownError {
                message,
                retry_after_seconds: None,
            })
    }
}

#[derive(Clone)]
pub struct ClosureEmailService {
    send_registration: Arc<dyn Fn(String, String, String) -> EmailFuture + Send + Sync>,
    send_password_reset: Arc<dyn Fn(String, String, String, i64) -> EmailFuture + Send + Sync>,
}

impl ClosureEmailService {
    pub fn new<FReg, FReset, FutReg, FutReset>(
        send_registration: FReg,
        send_password_reset: FReset,
    ) -> Self
    where
        FReg: Fn(String, String, String) -> FutReg + Send + Sync + 'static,
        FReset: Fn(String, String, String, i64) -> FutReset + Send + Sync + 'static,
        FutReg: Future<Output = ()> + Send + 'static,
        FutReset: Future<Output = ()> + Send + 'static,
    {
        Self {
            send_registration: Arc::new(move |email, name, verification_url| {
                Box::pin(send_registration(email, name, verification_url))
            }),
            send_password_reset: Arc::new(move |email, name, reset_url, expiry_hours| {
                Box::pin(send_password_reset(email, name, reset_url, expiry_hours))
            }),
        }
    }
}

#[async_trait]
impl EmailService for ClosureEmailService {
    async fn send_registration_email(&self, email: String, name: String, verification_url: String) {
        (self.send_registration)(email, name, verification_url).await
    }

    async fn send_password_reset_email(
        &self,
        email: String,
        name: String,
        reset_url: String,
        expiry_hours: i64,
    ) {
        (self.send_password_reset)(email, name, reset_url, expiry_hours).await
    }
}

#[derive(Clone)]
pub struct ClosureCooldownManager {
    check_cooldown: Arc<dyn Fn(CooldownType, Option<i32>) -> CooldownFuture + Send + Sync>,
    update_cooldown: Arc<dyn Fn(CooldownType, Option<i32>) -> CooldownFuture + Send + Sync>,
    record_failure: Arc<dyn Fn(CooldownType, Option<i32>) -> CooldownFuture + Send + Sync>,
    reset_cooldown: Arc<dyn Fn(CooldownType, Option<i32>) -> CooldownFuture + Send + Sync>,
}

impl ClosureCooldownManager {
    pub fn new<FCheck, FUpdate, FFail, FReset, FutCheck, FutUpdate, FutFail, FutReset>(
        check_cooldown: FCheck,
        update_cooldown: FUpdate,
        record_failure: FFail,
        reset_cooldown: FReset,
    ) -> Self
    where
        FCheck: Fn(CooldownType, Option<i32>) -> FutCheck + Send + Sync + 'static,
        FUpdate: Fn(CooldownType, Option<i32>) -> FutUpdate + Send + Sync + 'static,
        FFail: Fn(CooldownType, Option<i32>) -> FutFail + Send + Sync + 'static,
        FReset: Fn(CooldownType, Option<i32>) -> FutReset + Send + Sync + 'static,
        FutCheck: Future<Output = Result<(), CooldownError>> + Send + 'static,
        FutUpdate: Future<Output = Result<(), CooldownError>> + Send + 'static,
        FutFail: Future<Output = Result<(), CooldownError>> + Send + 'static,
        FutReset: Future<Output = Result<(), CooldownError>> + Send + 'static,
    {
        Self {
            check_cooldown: Arc::new(move |cooldown_type, user_id| {
                Box::pin(check_cooldown(cooldown_type, user_id))
            }),
            update_cooldown: Arc::new(move |cooldown_type, user_id| {
                Box::pin(update_cooldown(cooldown_type, user_id))
            }),
            record_failure: Arc::new(move |cooldown_type, user_id| {
                Box::pin(record_failure(cooldown_type, user_id))
            }),
            reset_cooldown: Arc::new(move |cooldown_type, user_id| {
                Box::pin(reset_cooldown(cooldown_type, user_id))
            }),
        }
    }
}

#[async_trait]
impl CooldownManager for ClosureCooldownManager {
    async fn check_cooldown(
        &self,
        cooldown_type: CooldownType,
        user_id: Option<i32>,
    ) -> Result<(), CooldownError> {
        (self.check_cooldown)(cooldown_type, user_id).await
    }

    async fn update_cooldown(
        &self,
        cooldown_type: CooldownType,
        user_id: Option<i32>,
    ) -> Result<(), CooldownError> {
        (self.update_cooldown)(cooldown_type, user_id).await
    }

    async fn record_failure(
        &self,
        cooldown_type: CooldownType,
        user_id: Option<i32>,
    ) -> Result<(), CooldownError> {
        (self.record_failure)(cooldown_type, user_id).await
    }

    async fn reset_cooldown(
        &self,
        cooldown_type: CooldownType,
        user_id: Option<i32>,
    ) -> Result<(), CooldownError> {
        (self.reset_cooldown)(cooldown_type, user_id).await
    }
}

// ── SeaORM cooldown backend ──────────────────────────────────────────────────

/// A ready-made [`CooldownBackend`] backed by SeaORM.
/// Stores all auth cooldown records in the `cooldowns` table under the
/// `"auth"` subject type with an action derived from [`CooldownType`].
/// Apps that use the standard auth DB schema should not need to write their
/// own backend.
#[derive(Clone)]
pub struct SeaOrmCooldownBackend {
    db: Arc<DatabaseConnection>,
}

impl SeaOrmCooldownBackend {
    pub fn new(db: Arc<DatabaseConnection>) -> Self {
        Self { db }
    }

    fn action_for(t: crate::traits::CooldownType) -> &'static str {
        match t {
            crate::traits::CooldownType::Login => "login",
            crate::traits::CooldownType::EmailResend => "email_resend",
            crate::traits::CooldownType::EmailForgotPassword => "email_forgot_password",
        }
    }
}

#[async_trait]
impl CooldownBackend for SeaOrmCooldownBackend {
    async fn check_cooldown(
        &self,
        cooldown_type: crate::traits::CooldownType,
        user_id: Option<i32>,
    ) -> Result<(), String> {
        use chrono::Utc;
        const COOLDOWN_SECS: i64 = 60;

        let rec = crate::entities::cooldowns::Model::find_by(
            &self.db,
            "auth",
            user_id,
            Self::action_for(cooldown_type),
        )
        .await
        .map_err(|e| e.to_string())?;

        if let Some(r) = rec {
            if let Some(last) = r.last_run {
                let elapsed = Utc::now().signed_duration_since(last).num_seconds();
                if elapsed < COOLDOWN_SECS {
                    let retry = COOLDOWN_SECS - elapsed;
                    return Err(format!(
                        "Too many attempts. Try again in {} seconds.",
                        retry
                    ));
                }
            }
        }
        Ok(())
    }

    async fn update_cooldown(
        &self,
        cooldown_type: crate::traits::CooldownType,
        user_id: Option<i32>,
    ) -> Result<(), String> {
        crate::entities::cooldowns::Model::upsert_last_run(
            &self.db,
            "auth",
            user_id,
            Self::action_for(cooldown_type),
            chrono::Utc::now(),
        )
        .await
        .map_err(|e| e.to_string())
    }

    async fn record_failure(
        &self,
        cooldown_type: crate::traits::CooldownType,
        user_id: Option<i32>,
    ) -> Result<(), String> {
        crate::entities::cooldowns::Model::increment_attempts(
            &self.db,
            "auth",
            user_id,
            Self::action_for(cooldown_type),
        )
        .await
        .map(|_| ())
        .map_err(|e| e.to_string())
    }

    async fn reset_cooldown(
        &self,
        cooldown_type: crate::traits::CooldownType,
        user_id: Option<i32>,
    ) -> Result<(), String> {
        crate::entities::cooldowns::Model::reset_attempts(
            &self.db,
            "auth",
            user_id,
            Self::action_for(cooldown_type),
        )
        .await
        .map_err(|e| e.to_string())
    }
}

/// Ready-made cooldown manager using [`SeaOrmCooldownBackend`].
pub type DefaultCooldownManager = BackendCooldownManager<SeaOrmCooldownBackend>;

/// Convenience type alias for a fully-wired `AuthService` using the standard
/// SeaORM-backed adapters. Apps only need to supply their own email service
/// and config provider.
pub type DefaultAuthService<E, F> = crate::services::AuthService<
    E,
    DefaultCooldownManager,
    SeaOrmAuditLogger,
    FnMetricsRecorder,
    F,
>;

/// Build a fully-wired [`DefaultAuthService`].
///
/// This is the main entry point for constructing an `AuthService` in
/// applications that use the Kaleido auth DB schema. Pass in:
/// - `db`      – a shared DB connection for audit log + cooldown writes
/// - `email`   – the app's email service (usually a `TaskQueueEmailService`)
/// - `config`  – app config provider (frontend URL, JWT secret)
/// - `metrics` – a [`FnMetricsRecorder`] with the app's metric hooks
pub fn build_default_auth_service<E, F>(
    db: Arc<DatabaseConnection>,
    email: E,
    config: F,
    metrics: FnMetricsRecorder,
) -> DefaultAuthService<E, F>
where
    E: crate::traits::EmailService,
    F: crate::traits::ConfigProvider,
{
    crate::services::AuthService::new(
        email,
        DefaultCooldownManager::new(SeaOrmCooldownBackend::new(db.clone())),
        SeaOrmAuditLogger::new(db),
        metrics,
        config,
    )
}

// ── SeaORM audit logger ───────────────────────────────────────────────────────

#[derive(Clone)]
pub struct SeaOrmAuditLogger {
    db: Arc<DatabaseConnection>,
}

impl SeaOrmAuditLogger {
    pub fn new(db: Arc<DatabaseConnection>) -> Self {
        Self { db }
    }
}

#[async_trait]
impl crate::traits::AuditLogger for SeaOrmAuditLogger {
    async fn log_event(
        &self,
        event_type: crate::traits::AuthEventType,
        payload: crate::traits::AuthEventPayload,
    ) -> Result<(), String> {
        let shared_event_type = match event_type {
            crate::traits::AuthEventType::LoginSucceeded => {
                crate::entities::auth_events::EventType::LoginSucceeded
            }
            crate::traits::AuthEventType::LoginFailed => {
                crate::entities::auth_events::EventType::LoginFailed
            }
            crate::traits::AuthEventType::Logout => crate::entities::auth_events::EventType::Logout,
            crate::traits::AuthEventType::TokenRefresh => {
                crate::entities::auth_events::EventType::TokenRefresh
            }
            crate::traits::AuthEventType::TokenRefreshFailed => {
                crate::entities::auth_events::EventType::TokenRefreshFailed
            }
            crate::traits::AuthEventType::PasswordResetRequest => {
                crate::entities::auth_events::EventType::PasswordResetRequest
            }
            crate::traits::AuthEventType::PasswordReset => {
                crate::entities::auth_events::EventType::PasswordReset
            }
        };

        let shared_payload = crate::entities::auth_events::AuthEventPayload {
            user_id: payload.user_id,
            email: payload.email,
            reason: payload.reason,
            ..Default::default()
        };

        crate::entities::auth_events::Model::record(&self.db, &shared_event_type, shared_payload)
            .await
            .map_err(|e| e.to_string())
    }
}

#[derive(Clone)]
pub struct FnMetricsRecorder {
    record_login: Arc<dyn Fn() + Send + Sync>,
    record_failed_login: Arc<dyn Fn() + Send + Sync>,
    record_logout: Arc<dyn Fn() + Send + Sync>,
    record_token_refresh: Arc<dyn Fn() + Send + Sync>,
}

impl FnMetricsRecorder {
    pub fn new<FLogin, FFailed, FLogout, FRefresh>(
        record_login: FLogin,
        record_failed_login: FFailed,
        record_logout: FLogout,
        record_token_refresh: FRefresh,
    ) -> Self
    where
        FLogin: Fn() + Send + Sync + 'static,
        FFailed: Fn() + Send + Sync + 'static,
        FLogout: Fn() + Send + Sync + 'static,
        FRefresh: Fn() + Send + Sync + 'static,
    {
        Self {
            record_login: Arc::new(record_login),
            record_failed_login: Arc::new(record_failed_login),
            record_logout: Arc::new(record_logout),
            record_token_refresh: Arc::new(record_token_refresh),
        }
    }
}

impl crate::traits::MetricsRecorder for FnMetricsRecorder {
    fn record_login(&self) {
        (self.record_login)();
    }

    fn record_failed_login(&self) {
        (self.record_failed_login)();
    }

    fn record_logout(&self) {
        (self.record_logout)();
    }

    fn record_token_refresh(&self) {
        (self.record_token_refresh)();
    }
}

#[derive(Clone)]
pub struct StaticConfigProvider {
    frontend_url: Arc<str>,
    jwt_secret: Arc<str>,
}

impl StaticConfigProvider {
    pub fn new(frontend_url: impl Into<String>, jwt_secret: impl Into<String>) -> Self {
        Self {
            frontend_url: Arc::<str>::from(frontend_url.into()),
            jwt_secret: Arc::<str>::from(jwt_secret.into()),
        }
    }
}

impl crate::traits::ConfigProvider for StaticConfigProvider {
    fn frontend_url(&self) -> &str {
        &self.frontend_url
    }

    fn jwt_secret(&self) -> &str {
        &self.jwt_secret
    }
}

// ── AuthTaskQueue ─────────────────────────────────────────────────────────────

/// A ready-made task queue for auth email tasks backed by [`background_jobs::DurableStorage`].
///
/// Apps that only have auth tasks can use this directly.
/// Apps with additional task types can embed this inside their own queue and
/// delegate email dispatching to it via `.clone()`.
#[derive(Clone)]
pub struct AuthTaskQueue {
    inner: background_jobs::TaskQueue<background_jobs::DurableStorage>,
}

impl AuthTaskQueue {
    pub fn new(db: sea_orm::DatabaseConnection) -> Self {
        let storage = background_jobs::DurableStorage::new(db);
        Self {
            inner: background_jobs::TaskQueue::new(storage),
        }
    }

    /// Access the underlying `background_jobs::TaskQueue` (e.g. to enqueue
    /// app-specific tasks from a wrapper queue struct).
    pub fn inner(&self) -> &background_jobs::TaskQueue<background_jobs::DurableStorage> {
        &self.inner
    }
}

#[async_trait]
impl EmailTaskDispatcher for AuthTaskQueue {
    async fn send_registration_email(&self, email: String, name: String, verification_url: String) {
        crate::worker::tasks::enqueue_email_registration(
            &self.inner,
            email,
            name,
            verification_url,
        )
        .await;
    }

    async fn send_password_reset_email(
        &self,
        email: String,
        name: String,
        reset_url: String,
        expiry_hours: i64,
    ) {
        crate::worker::tasks::enqueue_email_password_reset(
            &self.inner,
            email,
            name,
            reset_url,
            expiry_hours as u32,
        )
        .await;
    }
}

// ── EnvConfigProvider ─────────────────────────────────────────────────────────

/// A [`ConfigProvider`] that reads `FRONTEND_URL` and `JWT_SECRET` from env vars.
/// This is the standard config provider for apps that follow the Kaleido env
/// convention. Apps with a different env naming can still use [`StaticConfigProvider`].
#[derive(Clone)]
pub struct EnvConfigProvider {
    frontend_url: Arc<str>,
    jwt_secret: Arc<str>,
}

impl EnvConfigProvider {
    pub fn from_env() -> Self {
        Self {
            frontend_url: Arc::from(
                std::env::var("FRONTEND_URL")
                    .unwrap_or_else(|_| "http://localhost:5173".to_string()),
            ),
            jwt_secret: Arc::from(
                std::env::var("JWT_SECRET").unwrap_or_else(|_| "change_me_in_dev".to_string()),
            ),
        }
    }
}

impl crate::traits::ConfigProvider for EnvConfigProvider {
    fn frontend_url(&self) -> &str {
        &self.frontend_url
    }

    fn jwt_secret(&self) -> &str {
        &self.jwt_secret
    }
}

// ── Zero-config auth service entry point ─────────────────────────────────────

/// Email service wrapping [`AuthTaskQueue`].
pub type AuthEmailService = TaskQueueEmailService<AuthTaskQueue>;

/// Fully-wired auth service using env config and SeaORM-backed adapters.
/// Apps that want custom metrics can call [`build_default_auth_service`] instead.
pub type DefaultEnvAuthService = DefaultAuthService<AuthEmailService, EnvConfigProvider>;

/// Create a fully-wired [`DefaultEnvAuthService`] — the single entry point for
/// apps that use the standard Kaleido auth stack.
///
/// - Reads `FRONTEND_URL` and `JWT_SECRET` from environment.
/// - Writes audit events and cooldown state to the provided DB.
/// - Emits `tracing::debug!` for auth metric events.
pub fn create_auth_service(
    db: Arc<DatabaseConnection>,
    queue: AuthTaskQueue,
) -> DefaultEnvAuthService {
    build_default_auth_service(
        db,
        AuthEmailService::new(queue),
        EnvConfigProvider::from_env(),
        FnMetricsRecorder::new(
            || tracing::debug!("auth.login"),
            || tracing::debug!("auth.login_failed"),
            || tracing::debug!("auth.logout"),
            || tracing::debug!("auth.token_refresh"),
        ),
    )
}
