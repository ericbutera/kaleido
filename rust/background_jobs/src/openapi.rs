// OpenAPI re-exports for the background_jobs crate.
// Exposes commonly useful schema types that services may wish to include.

pub mod schemas {
    pub use crate::storage::{TaskRecord, TaskStatus};
}

pub mod tags {
    pub const TAGS: &[(&str, &str)] = &[("tasks", "Background task APIs and task metadata")];
}
