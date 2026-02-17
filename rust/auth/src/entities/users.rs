use crate::error::AuthError;
use chrono::{DateTime, Utc};
use sea_orm::entity::prelude::*;
use sea_orm::{DatabaseConnection, DbErr};
use uuid::Uuid;

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "users")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub pid: Uuid,
    pub email: String,
    pub password: Option<String>,
    pub api_key: String,
    pub name: String,
    pub is_admin: Option<bool>,
    pub reset_token: Option<String>,
    pub reset_sent_at: Option<DateTime<Utc>>,
    pub email_verification_token: Option<String>,
    pub email_verification_sent_at: Option<DateTime<Utc>>,
    pub email_verified_at: Option<DateTime<Utc>>,
    pub magic_link_token: Option<String>,
    pub magic_link_expiration: Option<DateTime<Utc>>,
    pub google_id: Option<String>,
    pub oauth_provider: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

impl Model {
    pub async fn find_by_pid(db: &DatabaseConnection, pid: &Uuid) -> Result<Option<Self>, DbErr> {
        Entity::find().filter(Column::Pid.eq(*pid)).one(db).await
    }

    pub async fn find_by_email(
        db: &DatabaseConnection,
        email: &str,
    ) -> Result<Option<Self>, DbErr> {
        Entity::find()
            .filter(Column::Email.eq(email.to_string()))
            .one(db)
            .await
    }

    /// Validate that this user's reset token timestamp exists and is not expired.
    pub fn validate_reset_token(&self) -> Result<(), AuthError> {
        let sent_at = self
            .reset_sent_at
            .ok_or_else(|| AuthError::validation("Invalid reset token"))?;
        let expiry_time = sent_at + chrono::Duration::hours(24);
        if Utc::now() > expiry_time {
            return Err(AuthError::validation("Reset token has expired"));
        }
        Ok(())
    }

    pub async fn find_by_reset_token(
        db: &DatabaseConnection,
        token: &str,
    ) -> Result<Self, AuthError> {
        let user_opt = Entity::find()
            .filter(Column::ResetToken.eq(token))
            .one(db)
            .await
            .map_err(|e| AuthError::from(e))?;

        let user = user_opt.ok_or_else(|| AuthError::validation("Invalid or expired reset token"))?;

        let sent_at = user
            .reset_sent_at
            .ok_or_else(|| AuthError::validation("Invalid or expired reset token"))?;

        let expiry_time = sent_at + chrono::Duration::hours(24);
        if Utc::now() > expiry_time {
            return Err(AuthError::validation("Invalid or expired reset token"));
        }

        Ok(user)
    }
}
