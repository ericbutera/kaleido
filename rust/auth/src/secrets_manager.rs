use crate::error::AuthError;
use async_trait::async_trait;

#[async_trait]
pub trait SecretsManager: Send + Sync {
    async fn get_secret(&self, name: &str) -> Result<String, AuthError>;
    async fn put_secret(&self, name: &str, value: &str) -> Result<(), AuthError>;
    async fn delete_secret(&self, name: &str) -> Result<(), AuthError>;
}

// SDK-only GCP implementation. Requires the Google Secret Manager SDK + yup-oauth2 + hyper features.
#[cfg(all(
    feature = "google-secretmanager1",
    feature = "yup-oauth2",
    feature = "hyper-util",
    feature = "hyper-rustls"
))]
pub mod gcp {
    use super::SecretsManager;
    use crate::error::AuthError;
    use async_trait::async_trait;
    use base64::Engine;
    use google_secretmanager1 as secretmanager;
    use hyper_rustls::HttpsConnectorBuilder;
    use hyper_util::client::legacy::Client as HyperClient;
    use hyper_util::rt::TokioExecutor;
    use yup_oauth2::client::CustomHyperClientBuilder;
    use yup_oauth2::{read_service_account_key, ServiceAccountAuthenticator};
    use std::sync::Arc;

    pub struct Impl {
        project: String,
        hub: secretmanager::SecretManager<hyper_util::client::legacy::Client<TokioExecutor>>,
    }

    impl Impl {
        pub async fn new(project: String) -> Result<Self, AuthError> {
            let sa_path = std::env::var("GOOGLE_APPLICATION_CREDENTIALS").map_err(|_| {
                AuthError::internal_error(
                    "GOOGLE_APPLICATION_CREDENTIALS must be set for google-secretmanager1 auth",
                )
            })?;
            let key = read_service_account_key(&sa_path)
                .await
                .map_err(|e| AuthError::internal_error(format!("failed reading service account key: {}", e)))?;

            let connector = HttpsConnectorBuilder::new()
                .with_native_roots()
                .unwrap()
                .https_or_http()
                .enable_http2()
                .build();

            let executor = TokioExecutor::new();
            let hyper_client: hyper_util::client::legacy::Client<TokioExecutor, hyper::body::Body> =
                hyper_util::client::legacy::Client::builder(executor.clone()).build(connector);

            let auth = ServiceAccountAuthenticator::builder(key)
                .with_client(CustomHyperClientBuilder::from(hyper_client.clone()))
                .build()
                .await
                .map_err(|e| AuthError::internal_error(format!("auth build error: {}", e)))?;

            let hub = secretmanager::SecretManager::new(hyper_client, auth);
            Ok(Self { project, hub })
        }

        pub async fn access_secret(&self, name: &str) -> Result<String, AuthError> {
            let resource = format!("projects/{}/secrets/{}/versions/latest", self.project, name);
            let resp = self
                .hub
                .projects()
                .secrets_versions_access(&resource)
                .doit()
                .await
                .map_err(|e| AuthError::internal_error(format!("google api access error: {}", e)))?;

            let payload = resp.1.payload.and_then(|p| p.data).ok_or_else(|| {
                AuthError::internal_error("no payload data from secretmanager response")
            })?;
            let decoded = base64::engine::general_purpose::STANDARD
                .decode(payload)
                .map_err(|e| AuthError::internal_error(format!("base64 decode error: {}", e)))?;
            let s = String::from_utf8(decoded).map_err(|e| AuthError::internal_error(format!("utf8 error: {}", e)))?;
            Ok(s)
        }

        pub async fn create_secret_if_missing(&self, name: &str) -> Result<(), AuthError> {
            let parent = format!("projects/{}/secrets", self.project);
            let secret = secretmanager::api::Secret {
                replication: Some(secretmanager::api::Replication { automatic: Some(secretmanager::api::Automatic { customer_managed_encryption: None }), user_managed: None }),
                ..Default::default()
            };
            let _ = self
                .hub
                .projects()
                .secrets_create(secret, &parent)
                .secret_id(name)
                .doit()
                .await;
            Ok(())
        }

        pub async fn add_secret_version(&self, name: &str, value: &[u8]) -> Result<(), AuthError> {
            let parent = format!("projects/{}/secrets/{}", self.project, name);
            let req = secretmanager::api::AddSecretVersionRequest {
                payload: Some(secretmanager::api::SecretPayload { data: Some(base64::engine::general_purpose::STANDARD.encode(value)), data_crc32c: None }),
            };
            let _ = self
                .hub
                .projects()
                .secrets_versions_add(&parent, req)
                .doit()
                .await
                .map_err(|e| AuthError::internal_error(format!("add version error: {}", e)))?;
            Ok(())
        }

        pub async fn delete_secret(&self, name: &str) -> Result<(), AuthError> {
            let name = format!("projects/{}/secrets/{}", self.project, name);
            let _ = self
                .hub
                .projects()
                .secrets_delete(&name)
                .doit()
                .await
                .map_err(|e| AuthError::internal_error(format!("delete secret error: {}", e)))?;
            Ok(())
        }
    }

    // Public wrapper that exposes the SDK-backed implementation via the `SecretsManager` trait.
    pub struct GcpSecretsManager {
        project: String,
        #[allow(dead_code)]
        inner: Arc<tokio::sync::Mutex<Option<()>>>,
    }

    impl GcpSecretsManager {
        pub async fn new(project: String) -> Result<Self, AuthError> {
            Ok(Self { project, inner: Arc::new(tokio::sync::Mutex::new(None)) })
        }
    }

    #[async_trait]
    impl SecretsManager for GcpSecretsManager {
        async fn get_secret(&self, name: &str) -> Result<String, AuthError> {
            let impln = Impl::new(self.project.clone()).await?;
            impln.access_secret(name).await
        }

        async fn put_secret(&self, name: &str, value: &str) -> Result<(), AuthError> {
            let impln = Impl::new(self.project.clone()).await?;
            impln.create_secret_if_missing(name).await?;
            impln.add_secret_version(name, value.as_bytes()).await?;
            Ok(())
        }

        async fn delete_secret(&self, name: &str) -> Result<(), AuthError> {
            let impln = Impl::new(self.project.clone()).await?;
            impln.delete_secret(name).await?;
            Ok(())
        }
    }
}

/// Create a default, GCP SDK-backed secrets manager. Returns an error if the SDK
/// features are not enabled at build time.
#[cfg(all(
    feature = "google-secretmanager1",
    feature = "yup-oauth2",
    feature = "hyper-util",
    feature = "hyper-rustls"
))]
pub async fn create_secrets_manager(project: Option<String>) -> Result<std::sync::Arc<dyn SecretsManager>, AuthError> {
    let proj = match project {
        Some(p) => p,
        None => std::env::var("GCP_PROJECT").map_err(|_| AuthError::internal_error("GCP_PROJECT must be set to use GCP Secret Manager SDK"))?,
    };

    let manager = gcp::GcpSecretsManager::new(proj).await?;
    Ok(std::sync::Arc::new(manager))
}

#[cfg(not(all(
    feature = "google-secretmanager1",
    feature = "yup-oauth2",
    feature = "hyper-util",
    feature = "hyper-rustls"
)))]
pub async fn create_secrets_manager(_project: Option<String>) -> Result<std::sync::Arc<dyn SecretsManager>, AuthError> {
    Err(AuthError::internal_error("Google Secret Manager SDK features are not enabled. Build with features: google-secretmanager1,yup-oauth2,hyper-util,hyper-rustls"))
}
