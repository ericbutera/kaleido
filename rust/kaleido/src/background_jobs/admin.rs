use crate::background_jobs::entities::background_tasks;
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::get,
    Json, Router,
};
use sea_orm::{
    ColumnTrait, DatabaseConnection, EntityTrait, JsonValue, PaginatorTrait, QueryFilter,
    QueryOrder,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

/// Storage trait for background tasks admin routes.
pub trait BackgroundTasksStorage: Send + Sync + 'static {
    fn db(&self) -> &DatabaseConnection;
}

/// Marker trait for types that verify admin authorization.
///
/// Implement this for your admin extractor so it can be used as the admin guard
/// for [`admin_routes`]. For example, with `auth::AdminUserContext`:
///
/// ```ignore
/// impl<S> background_jobs::admin::AdminVerified for auth::AdminUserContext<S> {}
/// ```
pub trait AdminVerified {}

/// Returns an admin router for background task management.
///
/// `A` must be an extractor that implements [`AdminVerified`], ensuring only
/// admin-authenticated requests reach the handlers.
///
/// # Example
///
/// ```ignore
/// use auth::AdminUserContext;
///
/// // In controllers/mod.rs:
/// impl background_jobs::admin::AdminVerified for AdminUserContext<AppStorage> {}
///
/// router.nest(
///     "/api/admin/tasks",
///     background_jobs::admin::admin_routes::<AppStorage, AdminUserContext<AppStorage>>(),
/// )
/// ```
pub fn admin_routes<S, A>() -> Router<Arc<S>>
where
    S: BackgroundTasksStorage + 'static,
    A: AdminVerified + axum::extract::FromRequestParts<Arc<S>> + Send + 'static,
    <A as axum::extract::FromRequestParts<Arc<S>>>::Rejection: IntoResponse,
{
    Router::new()
        .route("/", get(list_tasks::<S, A>))
        .route("/:id", get(get_task::<S, A>))
}

// ── Error ─────────────────────────────────────────────────────────────────────

#[derive(Debug)]
struct AdminTaskError {
    code: StatusCode,
    message: String,
}

impl AdminTaskError {
    fn not_found(message: impl Into<String>) -> Self {
        Self {
            code: StatusCode::NOT_FOUND,
            message: message.into(),
        }
    }
}

impl From<sea_orm::DbErr> for AdminTaskError {
    fn from(e: sea_orm::DbErr) -> Self {
        Self {
            code: StatusCode::INTERNAL_SERVER_ERROR,
            message: e.to_string(),
        }
    }
}

impl IntoResponse for AdminTaskError {
    fn into_response(self) -> Response {
        let body = Json(serde_json::json!({ "error": self.message }));
        (self.code, body).into_response()
    }
}

// ── Query / Response types ────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct TaskListQuery {
    pub task_type: Option<String>,
    pub status: Option<String>,
    pub error: Option<String>,
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

#[derive(Debug, Serialize)]
pub struct PaginationMetadata {
    pub page: i64,
    pub per_page: i64,
    pub total: i64,
    pub total_pages: i64,
}

#[derive(Debug, Serialize)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub metadata: PaginationMetadata,
}

impl<T> PaginatedResponse<T> {
    fn new(data: Vec<T>, page: i64, per_page: i64, total: i64) -> Self {
        let total_pages = if per_page > 0 {
            (total as f64 / per_page as f64).ceil() as i64
        } else {
            0
        };
        Self {
            data,
            metadata: PaginationMetadata {
                page,
                per_page,
                total,
                total_pages,
            },
        }
    }
}

#[derive(Debug, Serialize)]
pub struct TaskResponse {
    pub id: i32,
    pub task_type: String,
    pub status: String,
    pub attempts: i32,
    pub max_attempts: i32,
    pub error: Option<String>,
    pub result: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub scheduled_for: Option<String>,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
}

impl From<background_tasks::Model> for TaskResponse {
    fn from(m: background_tasks::Model) -> Self {
        Self {
            id: m.id,
            task_type: m.task_type,
            status: m.status,
            attempts: m.attempts,
            max_attempts: m.max_attempts,
            error: m.error,
            result: m.result,
            created_at: m.created_at.to_rfc3339(),
            updated_at: m.updated_at.to_rfc3339(),
            scheduled_for: m.scheduled_for.map(|d| d.to_rfc3339()),
            started_at: m.started_at.map(|d| d.to_rfc3339()),
            completed_at: m.completed_at.map(|d| d.to_rfc3339()),
        }
    }
}

#[derive(Debug, Serialize)]
pub struct TaskDetailResponse {
    pub id: i32,
    pub task_type: String,
    pub status: String,
    pub attempts: i32,
    pub max_attempts: i32,
    pub error: Option<String>,
    pub result: Option<String>,
    pub payload: Option<JsonValue>,
    pub created_at: String,
    pub updated_at: String,
    pub scheduled_for: Option<String>,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
}

impl From<background_tasks::Model> for TaskDetailResponse {
    fn from(m: background_tasks::Model) -> Self {
        Self {
            id: m.id,
            task_type: m.task_type,
            status: m.status,
            attempts: m.attempts,
            max_attempts: m.max_attempts,
            error: m.error,
            result: m.result,
            payload: Some(m.payload),
            created_at: m.created_at.to_rfc3339(),
            updated_at: m.updated_at.to_rfc3339(),
            scheduled_for: m.scheduled_for.map(|d| d.to_rfc3339()),
            started_at: m.started_at.map(|d| d.to_rfc3339()),
            completed_at: m.completed_at.map(|d| d.to_rfc3339()),
        }
    }
}

// ── Handlers ──────────────────────────────────────────────────────────────────

async fn list_tasks<S, A>(
    _admin: A,
    State(state): State<Arc<S>>,
    Query(params): Query<TaskListQuery>,
) -> Result<Json<PaginatedResponse<TaskResponse>>, AdminTaskError>
where
    S: BackgroundTasksStorage,
    A: AdminVerified,
{
    let db = BackgroundTasksStorage::db(&*state);
    let page = params.page.max(1);
    let per_page = params.per_page.clamp(1, 100);

    let mut query =
        background_tasks::Entity::find().order_by_desc(background_tasks::Column::CreatedAt);

    if let Some(ref t) = params.task_type {
        query = query.filter(background_tasks::Column::TaskType.eq(t.clone()));
    }
    if let Some(ref s) = params.status {
        query = query.filter(background_tasks::Column::Status.eq(s.clone()));
    }
    if let Some(ref e) = params.error {
        query = query.filter(background_tasks::Column::Error.contains(e.as_str()));
    }

    let paginator = query.paginate(db, per_page);
    let total = paginator.num_items().await? as i64;
    let items = paginator.fetch_page(page - 1).await?;
    let data: Vec<TaskResponse> = items.into_iter().map(TaskResponse::from).collect();

    Ok(Json(PaginatedResponse::new(
        data,
        page as i64,
        per_page as i64,
        total,
    )))
}

async fn get_task<S, A>(
    _admin: A,
    State(state): State<Arc<S>>,
    Path(id): Path<i32>,
) -> Result<Json<TaskDetailResponse>, AdminTaskError>
where
    S: BackgroundTasksStorage,
    A: AdminVerified,
{
    let db = BackgroundTasksStorage::db(&*state);
    let task = background_tasks::Entity::find_by_id(id)
        .one(db)
        .await?
        .ok_or_else(|| AdminTaskError::not_found("Task not found"))?;

    Ok(Json(TaskDetailResponse::from(task)))
}
