//! External migrations exported for reuse by other projects.
pub use sea_orm_migration::prelude::*;
mod m20220101_000001_users;
mod m20260122_120000_background_tasks;
mod m20260124_120500_api_clients;

pub fn external_migrations() -> Vec<Box<dyn MigrationTrait>> {
    vec![
        Box::new(m20220101_000001_users::Migration),
        Box::new(m20260122_120000_background_tasks::Migration),
        Box::new(m20260124_120500_api_clients::Migration),
    ]
}
