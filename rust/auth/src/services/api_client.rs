use crate::entities::api_clients;
use crate::error::AuthError;
use crate::tokens::{access_token_ttl_seconds, generate_api_client_access_token};
use argon2::password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;
use chrono::Utc;
use rand::{distributions::Alphanumeric, rngs::OsRng, Rng};
use sea_orm::{ActiveModelTrait, DatabaseConnection, Set};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use utoipa::ToSchema;
use uuid::Uuid;
use validator::Validate;

#[derive(Serialize, ToSchema)]
pub struct ClientLoginResponse {
    pub access_token: String,
    pub token_type: String,
    pub expires_in: i64,
    pub client_id: String,
    pub scopes: Vec<String>,
}

pub struct ApiClientService;

pub mod scopes {
    pub const PROVIDER_SETTINGS_READ: &str = "oauth.providers:read";
    pub const PROVIDER_SETTINGS_WRITE: &str = "oauth.providers:write";
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateApiClientRequest {
    #[validate(length(min = 3, max = 255, message = "name must be 3-255 characters"))]
    pub name: String,
    #[validate(length(max = 2000, message = "description too long"))]
    pub description: Option<String>,
    #[serde(default)]
    pub scopes: Vec<String>,
    pub owner_user_id: Option<i32>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ApiClientCredentials {
    pub client_id: Uuid,
    pub client_secret: String,
}

#[derive(Debug, Deserialize, Validate, ToSchema)]
pub struct ClientLoginRequest {
    pub client_id: String,
    #[validate(length(min = 8, message = "client secret required"))]
    pub client_secret: String,
}

impl ApiClientService {
    pub async fn create(
        db: &DatabaseConnection,
        payload: CreateApiClientRequest,
    ) -> Result<ApiClientCredentials, AuthError> {
        let data = payload;
        data.validate()
            .map_err(|e| AuthError::validation(e.to_string()))?;

        let client_id = Uuid::new_v4();
        let client_secret = generate_secret();
        let secret_hash = hash_secret(&client_secret)?;
        let scopes_json = JsonValue::Array(
            data.scopes
                .iter()
                .map(|scope| JsonValue::String(scope.to_string()))
                .collect(),
        );

        let active = api_clients::ActiveModel {
            client_id: Set(client_id),
            client_secret_hash: Set(secret_hash),
            name: Set(data.name.clone()),
            description: Set(data.description.clone()),
            scopes: Set(scopes_json),
            owner_user_id: Set(data.owner_user_id),
            ..Default::default()
        };

        active
            .insert(db)
            .await
            .map_err(|e| AuthError::internal_error(e.to_string()))?;

        Ok(ApiClientCredentials {
            client_id,
            client_secret,
        })
    }

    pub async fn rotate_secret(
        db: &DatabaseConnection,
        client_id: Uuid,
    ) -> Result<ApiClientCredentials, AuthError> {
        let client = api_clients::Model::find_by_client_id(db, &client_id)
            .await
            .map_err(|e| AuthError::internal_error(e.to_string()))?
            .ok_or_else(|| AuthError::entity_not_found("client not found"))?;

        let new_secret = generate_secret();
        let new_hash = hash_secret(&new_secret)?;

        let mut active: api_clients::ActiveModel = client.into();
        active.client_secret_hash = Set(new_hash);
        active
            .update(db)
            .await
            .map_err(|e| AuthError::internal_error(e.to_string()))?;

        Ok(ApiClientCredentials {
            client_id,
            client_secret: new_secret,
        })
    }

    pub async fn authenticate(
        db: &DatabaseConnection,
        payload: ClientLoginRequest,
    ) -> Result<api_clients::Model, AuthError> {
        let req = payload;
        req.validate()
            .map_err(|e| AuthError::validation(e.to_string()))?;

        let client_id = Uuid::parse_str(&req.client_id)
            .map_err(|_| AuthError::unauthorized("invalid client credentials"))?;
        let client = api_clients::Model::find_by_client_id(db, &client_id)
            .await
            .map_err(|e| AuthError::internal_error(e.to_string()))?
            .ok_or_else(|| AuthError::unauthorized("invalid client credentials"))?;

        if client.revoked_at.is_some() {
            return Err(AuthError::unauthorized("client is revoked"));
        }

        verify_secret(&req.client_secret, &client.client_secret_hash)?;

        let mut active: api_clients::ActiveModel = client.into();
        active.last_used_at = Set(Some(Utc::now()));
        let updated = active
            .update(db)
            .await
            .map_err(|e| AuthError::internal_error(e.to_string()))?;
        Ok(updated)
    }

    /// Authenticate and return a controller-ready login response.
    pub async fn authenticate_and_build_response(
        db: &DatabaseConnection,
        payload: ClientLoginRequest,
        jwt_secret: &str,
    ) -> Result<ClientLoginResponse, AuthError> {
        let client = ApiClientService::authenticate(db, payload).await?;

        let token = generate_api_client_access_token(&client, jwt_secret)
            .map_err(|e| AuthError::internal_error(e.to_string()))?;
        let resp = ClientLoginResponse {
            access_token: token,
            token_type: "Bearer".to_string(),
            expires_in: access_token_ttl_seconds(),
            client_id: client.client_id.to_string(),
            scopes: client.parsed_scopes(),
        };
        Ok(resp)
    }
}

fn generate_secret() -> String {
    rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(48)
        .map(char::from)
        .collect()
}

fn hash_secret(secret: &str) -> Result<String, AuthError> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    argon2
        .hash_password(secret.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|e| AuthError::internal_error(format!("failed to hash secret: {}", e)))
}

fn verify_secret(secret: &str, hash: &str) -> Result<(), AuthError> {
    let parsed = PasswordHash::new(hash)
        .map_err(|_| AuthError::internal_error("stored secret hash is invalid"))?;
    Argon2::default()
        .verify_password(secret.as_bytes(), &parsed)
        .map_err(|_| AuthError::unauthorized("invalid client credentials"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_and_verify() {
        let secret = "test-secret-123";
        let hash = hash_secret(secret).expect("hash");
        verify_secret(secret, &hash).expect("verify");

        let wrong = verify_secret("wrong", &hash);
        assert!(wrong.is_err());
    }
}
