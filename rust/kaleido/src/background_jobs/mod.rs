// Background job processing library
//
// This crate provides a flexible task queue system with:
// - In-memory task queue (default, no persistence)
// - Durable task queue (PostgreSQL-backed)
// - Trait-based interface for custom implementations
// - Strongly-typed task definitions

pub mod entities;
pub mod error;
pub mod memory;
pub mod openapi;
pub mod queue;
pub mod storage;
pub mod task;

pub mod durable;
pub mod worker;
pub mod admin;

pub use entities::background_tasks;
pub use error::TaskError;
pub use memory::InMemoryStorage;
pub use queue::TaskQueue;
pub use storage::{TaskRecord, TaskStatus, TaskStorage};
pub use task::Task;

pub use durable::DurableStorage;
