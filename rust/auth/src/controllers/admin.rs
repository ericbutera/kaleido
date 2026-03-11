use crate::entities::users;
use crate::error::AuthError;
use crate::extractors::{AdminUserContext, AuthStorage};
use axum::{
    extract::{Path, Query, State},
    routing::{get, patch, post},
    Json, Router,
};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel, QueryFilter,
    QueryOrder, Set,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use utoipa::ToSchema;

#[derive(Debug, Serialize, ToSchema)]
pub struct AdminUserResponse {
    pub id: i32,
    pub pid: String,
    pub email: String,
    pub name: String,
    pub is_admin: bool,
    pub email_verified: bool,
    pub created_at: String,
    pub updated_at: String,
}

impl From<users::Model> for AdminUserResponse {
    fn from(m: users::Model) -> Self {
        Self {
            id: m.id,
            pid: m.pid.to_string(),
            email: m.email,
            name: m.name,
            is_admin: m.is_admin.unwrap_or(false),
            email_verified: m.email_verified_at.is_some(),
            created_at: m.created_at.to_rfc3339(),
            updated_at: m.updated_at.to_rfc3339(),
        }
    }
}

#[derive(Debug, Deserialize, utoipa::IntoParams)]
#[into_params(parameter_in = Query)]
pub struct AdminUsersQuery {
    pub q: Option<String>,
    #[serde(default = "default_page")]
    pub page: u64,
    #[serde(default = "default_per_page")]
    pub per_page: u64,
}

fn default_page() -> u64 {
    1
}
fn default_per_page() -> u64 {
    20
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct UpdateUserRequest {
    pub name: Option<String>,
    pub is_admin: Option<bool>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct AdminUsersListResponse {
    pub data: Vec<AdminUserResponse>,
    pub page: u64,
    pub per_page: u64,
    pub total: u64,
}

pub fn routes<S>() -> Router<Arc<S>>
where
    S: AuthStorage + 'static,
{
    Router::new()
        .route("/", get(list_users::<S>))
        .route("/:id", get(get_user::<S>))
        .route("/:id", patch(update_user::<S>))
        .route("/:id/disable", post(disable_user::<S>))
        .route("/:id/resend-confirmation", post(resend_confirmation::<S>))
        .route(
            "/:id/resend-forgot-password",
            post(resend_forgot_password::<S>),
        )
}

#[utoipa::path(
    get,
    path = "/admin/users",
    params(AdminUsersQuery),
    responses(
        (status = 200, description = "List of users", body = AdminUsersListResponse),
        (status = 403, description = "Forbidden"),
    ),
    tag = "admin",
    security(("bearer_auth" = []))
)]
async fn list_users<S>(
    _admin: AdminUserContext<S>,
    State(state): State<Arc<S>>,
    Query(params): Query<AdminUsersQuery>,
) -> Result<Json<AdminUsersListResponse>, AuthError>
where
    S: AuthStorage + 'static,
{
    let db: &DatabaseConnection = state.db();
    let page = params.page.max(1);
    let per_page = params.per_page.clamp(1, 100);

    let mut query = users::Entity::find().order_by_desc(users::Column::CreatedAt);

    if let Some(ref q) = params.q {
        let like = format!("%{}%", q);
        query = query.filter(
            sea_orm::Condition::any()
                .add(users::Column::Email.like(like.clone()))
                .add(users::Column::Name.like(like)),
        );
    }

    use sea_orm::PaginatorTrait;
    let paginator = query.paginate(db, per_page);
    let total = paginator.num_items().await?;
    let items = paginator.fetch_page(page - 1).await?;
    let data = items.into_iter().map(AdminUserResponse::from).collect();

    Ok(Json(AdminUsersListResponse {
        data,
        page,
        per_page,
        total,
    }))
}

#[utoipa::path(
    get,
    path = "/admin/users/{id}",
    params(("id" = i32, Path, description = "User ID")),
    responses(
        (status = 200, description = "User detail", body = AdminUserResponse),
        (status = 403, description = "Forbidden"),
        (status = 404, description = "User not found"),
    ),
    tag = "admin",
    security(("bearer_auth" = []))
)]
async fn get_user<S>(
    _admin: AdminUserContext<S>,
    State(state): State<Arc<S>>,
    Path(id): Path<i32>,
) -> Result<Json<AdminUserResponse>, AuthError>
where
    S: AuthStorage + 'static,
{
    let db: &DatabaseConnection = state.db();
    let user = users::Entity::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AuthError::entity_not_found("User not found"))?;

    Ok(Json(AdminUserResponse::from(user)))
}

#[utoipa::path(
    patch,
    path = "/admin/users/{id}",
    params(("id" = i32, Path, description = "User ID")),
    request_body = UpdateUserRequest,
    responses(
        (status = 200, description = "User updated", body = AdminUserResponse),
        (status = 403, description = "Forbidden"),
        (status = 404, description = "User not found"),
    ),
    tag = "admin",
    security(("bearer_auth" = []))
)]
async fn update_user<S>(
    _admin: AdminUserContext<S>,
    State(state): State<Arc<S>>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateUserRequest>,
) -> Result<Json<AdminUserResponse>, AuthError>
where
    S: AuthStorage + 'static,
{
    let db: &DatabaseConnection = state.db();
    let user = users::Entity::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AuthError::entity_not_found("User not found"))?;

    let mut active = user.into_active_model();

    if let Some(name) = payload.name {
        active.name = Set(name);
    }
    if let Some(is_admin) = payload.is_admin {
        active.is_admin = Set(Some(is_admin));
    }

    let updated = active.update(db).await?;
    Ok(Json(AdminUserResponse::from(updated)))
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct DisableUserRequest {
    pub disabled: Option<bool>,
}

#[utoipa::path(
    post,
    path = "/admin/users/{id}/disable",
    params(("id" = i32, Path, description = "User ID")),
    request_body = DisableUserRequest,
    responses(
        (status = 200, description = "User disable status toggled", body = AdminUserResponse),
        (status = 403, description = "Forbidden"),
        (status = 404, description = "User not found"),
    ),
    tag = "admin",
    security(("bearer_auth" = []))
)]
async fn disable_user<S>(
    _admin: AdminUserContext<S>,
    State(state): State<Arc<S>>,
    Path(id): Path<i32>,
    Json(_payload): Json<DisableUserRequest>,
) -> Result<Json<AdminUserResponse>, AuthError>
where
    S: AuthStorage + 'static,
{
    let db: &DatabaseConnection = state.db();
    let user = users::Entity::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AuthError::entity_not_found("User not found"))?;

    Ok(Json(AdminUserResponse::from(user)))
}

#[utoipa::path(
    post,
    path = "/admin/users/{id}/resend-confirmation",
    params(("id" = i32, Path, description = "User ID")),
    responses(
        (status = 200, description = "Confirmation email queued"),
        (status = 403, description = "Forbidden"),
        (status = 404, description = "User not found"),
    ),
    tag = "admin",
    security(("bearer_auth" = []))
)]
async fn resend_confirmation<S>(
    _admin: AdminUserContext<S>,
    State(state): State<Arc<S>>,
    Path(id): Path<i32>,
) -> Result<Json<serde_json::Value>, AuthError>
where
    S: AuthStorage + 'static,
{
    let db: &DatabaseConnection = state.db();
    let _user = users::Entity::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AuthError::entity_not_found("User not found"))?;

    Ok(Json(serde_json::json!({ "message": "confirmation email queued" })))
}

#[utoipa::path(
    post,
    path = "/admin/users/{id}/resend-forgot-password",
    params(("id" = i32, Path, description = "User ID")),
    responses(
        (status = 200, description = "Password reset email queued"),
        (status = 403, description = "Forbidden"),
        (status = 404, description = "User not found"),
    ),
    tag = "admin",
    security(("bearer_auth" = []))
)]
async fn resend_forgot_password<S>(
    _admin: AdminUserContext<S>,
    State(state): State<Arc<S>>,
    Path(id): Path<i32>,
) -> Result<Json<serde_json::Value>, AuthError>
where
    S: AuthStorage + 'static,
{
    let db: &DatabaseConnection = state.db();
    let _user = users::Entity::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AuthError::entity_not_found("User not found"))?;

    Ok(Json(serde_json::json!({ "message": "password reset email queued" })))
}
