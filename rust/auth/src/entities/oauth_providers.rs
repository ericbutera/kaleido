use sea_orm::entity::prelude::*;
use sea_orm::prelude::DateTimeWithTimeZone;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "oauth_providers")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub provider_name: String,
    pub client_id: String,
    pub client_secret: String,
    pub redirect_url: Option<String>,
    pub auth_url: Option<String>,
    pub token_url: Option<String>,
    pub userinfo_url: Option<String>,
    pub created_at: Option<DateTimeWithTimeZone>,
    pub updated_at: Option<DateTimeWithTimeZone>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
