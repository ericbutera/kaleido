//! External migrations exported for reuse by other projects.
pub use sea_orm_migration::prelude::*;
mod m20220101_000001_users;
mod m20220101_000002_refresh_tokens;
mod m20260107_120000_create_cooldowns;
mod m20260122_120000_background_tasks;
mod m20260124_120500_api_clients;
mod m20260125_212110_create_feature_flags;
mod m20260210_000001_auth_events;

pub fn external_migrations() -> Vec<Box<dyn MigrationTrait>> {
    vec![
        Box::new(m20220101_000001_users::Migration),
        Box::new(m20220101_000002_refresh_tokens::Migration),
        Box::new(m20260107_120000_create_cooldowns::Migration),
        Box::new(m20260122_120000_background_tasks::Migration),
        Box::new(m20260124_120500_api_clients::Migration),
        Box::new(m20260125_212110_create_feature_flags::Migration),
        Box::new(m20260210_000001_auth_events::Migration),
    ]
}
