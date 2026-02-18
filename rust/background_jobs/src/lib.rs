// Background job processing library
//
// This crate provides a flexible task queue system with:
// - In-memory task queue (default, no persistence)
// - Durable task queue (PostgreSQL-backed, optional)
// - Trait-based interface for custom implementations
// - Strongly-typed task definitions

pub mod entities;
pub mod error;
pub mod queue;
pub mod storage;
pub mod task;

// In-memory implementation (default)
pub mod memory;

// Durable implementation (optional, requires "durable" feature)
#[cfg(feature = "durable")]
pub mod durable;

// Re-exports (only when durable storage is enabled)
#[cfg(feature = "durable")]
pub use entities::background_tasks;
pub use error::TaskError;
pub use memory::InMemoryStorage;
pub use queue::TaskQueue;
pub use storage::{TaskRecord, TaskStatus, TaskStorage};
pub use task::Task;

#[cfg(feature = "durable")]
pub use durable::DurableStorage;
