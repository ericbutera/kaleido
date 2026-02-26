use async_trait::async_trait;
use background_jobs::worker::{TaskProcessor, TaskWorker, WorkerError};
use handlebars::Handlebars;
use lettre::message::{header::ContentType, Mailbox, MultiPart, SinglePart};
use lettre::transport::smtp::authentication::Credentials;
use lettre::{AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor};
use serde_json::json;
use std::collections::HashMap;

pub mod tasks;

use self::tasks::{EmailPasswordResetTask, EmailRegistrationTask};

#[derive(Debug, Clone)]
pub struct AuthWorkerConfig {
    pub app_name: String,
    pub smtp: AuthWorkerSmtpConfig,
    pub template_overrides: HashMap<String, String>,
}

impl AuthWorkerConfig {
    pub fn new(app_name: impl Into<String>, smtp: AuthWorkerSmtpConfig) -> Self {
        Self {
            app_name: app_name.into(),
            smtp,
            template_overrides: HashMap::new(),
        }
    }

    pub fn with_template_override(
        mut self,
        template_name: impl Into<String>,
        content: impl Into<String>,
    ) -> Self {
        self.template_overrides
            .insert(template_name.into(), content.into());
        self
    }
}

#[derive(Debug, Clone)]
pub struct AuthWorkerSmtpConfig {
    pub host: String,
    pub port: u16,
    pub username: Option<String>,
    pub password: Option<String>,
    pub from_email: String,
    pub from_name: String,
}

struct AuthEmailProcessorRuntime {
    app_name: String,
    mailer: AsyncSmtpTransport<Tokio1Executor>,
    from_mailbox: Mailbox,
    templates: Handlebars<'static>,
}

impl AuthEmailProcessorRuntime {
    fn new(config: &AuthWorkerConfig) -> Result<Self, WorkerError> {
        let mut mailer_builder = AsyncSmtpTransport::<Tokio1Executor>::relay(&config.smtp.host)
            .map_err(|e| format!("failed to init SMTP relay: {}", e))?
            .port(config.smtp.port);

        if let (Some(username), Some(password)) = (&config.smtp.username, &config.smtp.password) {
            mailer_builder =
                mailer_builder.credentials(Credentials::new(username.clone(), password.clone()));
        }

        let mailer = mailer_builder.build();

        let from_mailbox =
            Mailbox::new(
                Some(config.smtp.from_name.clone()),
                config.smtp.from_email.parse().map_err(|e| {
                    format!("invalid from email '{}': {}", config.smtp.from_email, e)
                })?,
            );

        let mut templates = Handlebars::new();
        register_default_templates(&mut templates)?;

        for (name, content) in &config.template_overrides {
            templates
                .register_template_string(name, content)
                .map_err(|e| format!("failed to register override template '{}': {}", name, e))?;
        }

        Ok(Self {
            app_name: config.app_name.clone(),
            mailer,
            from_mailbox,
            templates,
        })
    }

    fn render(&self, template_name: &str, data: &serde_json::Value) -> Result<String, WorkerError> {
        self.templates
            .render(template_name, data)
            .map_err(|e| format!("failed to render template '{}': {}", template_name, e).into())
    }

    async fn send_email(
        &self,
        to: &str,
        subject: &str,
        text_body: String,
        html_body: String,
    ) -> Result<(), WorkerError> {
        let to_mailbox = Mailbox::new(
            None,
            to.parse()
                .map_err(|e| format!("invalid recipient email '{}': {}", to, e))?,
        );

        let email = Message::builder()
            .from(self.from_mailbox.clone())
            .to(to_mailbox)
            .subject(subject)
            .multipart(
                MultiPart::alternative()
                    .singlepart(
                        SinglePart::builder()
                            .header(ContentType::TEXT_PLAIN)
                            .body(text_body),
                    )
                    .singlepart(
                        SinglePart::builder()
                            .header(ContentType::TEXT_HTML)
                            .body(html_body),
                    ),
            )
            .map_err(|e| format!("failed to build email message: {}", e))?;

        self.mailer
            .send(email)
            .await
            .map_err(|e| format!("failed to send email: {}", e))?;

        Ok(())
    }
}

pub struct EmailRegistrationProcessor {
    runtime: AuthEmailProcessorRuntime,
}

impl EmailRegistrationProcessor {
    pub fn new(config: &AuthWorkerConfig) -> Result<Self, WorkerError> {
        Ok(Self {
            runtime: AuthEmailProcessorRuntime::new(config)?,
        })
    }
}

#[async_trait]
impl TaskProcessor for EmailRegistrationProcessor {
    fn task_type(&self) -> &str {
        "email_registration"
    }

    async fn process(&self, _task_id: i32, payload: serde_json::Value) -> Result<(), WorkerError> {
        let data = payload.get("data").unwrap_or(&payload);
        let task: EmailRegistrationTask = serde_json::from_value(data.clone())
            .map_err(|e| format!("invalid email_registration payload: {}", e))?;

        let template_data = json!({
            "app_name": self.runtime.app_name,
            "name": task.name,
            "verification_url": task.verification_url,
        });

        let text_body = self.runtime.render("registration_text", &template_data)?;
        let html_body = self.runtime.render("registration_html", &template_data)?;
        let subject = format!("Welcome to {}!", self.runtime.app_name);

        self.runtime
            .send_email(&task.to, &subject, text_body, html_body)
            .await
    }
}

pub struct EmailPasswordResetProcessor {
    runtime: AuthEmailProcessorRuntime,
}

impl EmailPasswordResetProcessor {
    pub fn new(config: &AuthWorkerConfig) -> Result<Self, WorkerError> {
        Ok(Self {
            runtime: AuthEmailProcessorRuntime::new(config)?,
        })
    }
}

#[async_trait]
impl TaskProcessor for EmailPasswordResetProcessor {
    fn task_type(&self) -> &str {
        "email_password_reset"
    }

    async fn process(&self, _task_id: i32, payload: serde_json::Value) -> Result<(), WorkerError> {
        let data = payload.get("data").unwrap_or(&payload);
        let task: EmailPasswordResetTask = serde_json::from_value(data.clone())
            .map_err(|e| format!("invalid email_password_reset payload: {}", e))?;

        let template_data = json!({
            "app_name": self.runtime.app_name,
            "name": task.name,
            "reset_url": task.reset_url,
            "expiry_hours": task.expiry_hours,
        });

        let text_body = self.runtime.render("password_reset_text", &template_data)?;
        let html_body = self.runtime.render("password_reset_html", &template_data)?;
        let subject = format!("Reset your {} password", self.runtime.app_name);

        self.runtime
            .send_email(&task.to, &subject, text_body, html_body)
            .await
    }
}

pub fn register_auth_email_processors(
    worker: TaskWorker,
    config: &AuthWorkerConfig,
) -> Result<TaskWorker, WorkerError> {
    let email_registration = std::sync::Arc::new(EmailRegistrationProcessor::new(config)?);
    let email_password_reset = std::sync::Arc::new(EmailPasswordResetProcessor::new(config)?);

    Ok(worker
        .register_processor(email_registration)
        .register_processor(email_password_reset))
}

/// Register all auth-related task processors on the provided worker.
/// This is a single entry point apps can call to wire up auth processors.
pub fn register_all_auth_processors(
    worker: TaskWorker,
    config: &AuthWorkerConfig,
) -> Result<TaskWorker, WorkerError> {
    // Currently this delegates to the email processors registration.
    // Additional auth-related processors can be added here in the future.
    register_auth_email_processors(worker, config)
}

fn register_default_templates(registry: &mut Handlebars<'static>) -> Result<(), WorkerError> {
    registry
        .register_template_string(
            "registration_text",
            include_str!("templates/registration.txt"),
        )
        .map_err(|e| format!("failed to register registration_text: {}", e))?;
    registry
        .register_template_string(
            "registration_html",
            include_str!("templates/registration.html"),
        )
        .map_err(|e| format!("failed to register registration_html: {}", e))?;
    registry
        .register_template_string(
            "password_reset_text",
            include_str!("templates/password_reset.txt"),
        )
        .map_err(|e| format!("failed to register password_reset_text: {}", e))?;
    registry
        .register_template_string(
            "password_reset_html",
            include_str!("templates/password_reset.html"),
        )
        .map_err(|e| format!("failed to register password_reset_html: {}", e))?;

    Ok(())
}
