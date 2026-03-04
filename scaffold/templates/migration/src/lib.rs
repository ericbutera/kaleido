pub use sea_orm_migration::prelude::*;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
	fn migrations() -> Vec<Box<dyn MigrationTrait>> {
		let mut migrations = kaleido_migrations::external_migrations();
		migrations.sort_by_key(|m| m.name().to_string());
		migrations
	}
}
