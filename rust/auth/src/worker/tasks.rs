use background_jobs::storage::TaskStorage;
use background_jobs::TaskQueue;
use serde::{Deserialize, Serialize};

pub const EMAIL_REGISTRATION_TASK_TYPE: &str = "email_registration";
pub const EMAIL_PASSWORD_RESET_TASK_TYPE: &str = "email_password_reset";
pub const EMAIL_NOTIFICATION_TASK_TYPE: &str = "email_notification";

/// All auth-related task types (for easy registration/checking).
pub const AUTH_TASK_TYPES: &[&str] = &[
    EMAIL_REGISTRATION_TASK_TYPE,
    EMAIL_PASSWORD_RESET_TASK_TYPE,
    EMAIL_NOTIFICATION_TASK_TYPE,
];

/// Return a static slice with all auth task type strings.
pub fn all_auth_task_types() -> &'static [&'static str] {
    AUTH_TASK_TYPES
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailRegistrationTask {
    pub to: String,
    pub name: String,
    pub verification_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailPasswordResetTask {
    pub to: String,
    pub name: String,
    pub reset_url: String,
    pub expiry_hours: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailNotificationTask {
    pub to: String,
    pub subject: String,
    pub message: String,
}

pub async fn enqueue_email_registration<S: TaskStorage>(
    queue: &TaskQueue<S>,
    to: String,
    name: String,
    verification_url: String,
) {
    let _ = queue
        .enqueue(
            EMAIL_REGISTRATION_TASK_TYPE.to_string(),
            EmailRegistrationTask {
                to,
                name,
                verification_url,
            },
        )
        .await;
}

pub async fn enqueue_email_password_reset<S: TaskStorage>(
    queue: &TaskQueue<S>,
    to: String,
    name: String,
    reset_url: String,
    expiry_hours: u32,
) {
    let _ = queue
        .enqueue(
            EMAIL_PASSWORD_RESET_TASK_TYPE.to_string(),
            EmailPasswordResetTask {
                to,
                name,
                reset_url,
                expiry_hours,
            },
        )
        .await;
}

pub async fn enqueue_email_notification<S: TaskStorage>(
    queue: &TaskQueue<S>,
    to: String,
    subject: String,
    message: String,
) {
    let _ = queue
        .enqueue(
            EMAIL_NOTIFICATION_TASK_TYPE.to_string(),
            EmailNotificationTask {
                to,
                subject,
                message,
            },
        )
        .await;
}
