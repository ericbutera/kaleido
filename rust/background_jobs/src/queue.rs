use crate::error::TaskError;
use crate::storage::{TaskStorage, TaskRecord};
use chrono::Utc;
use std::sync::Arc;
use tracing::debug;

/// TaskQueue provides a high-level interface for enqueuing and managing background tasks
pub struct TaskQueue<S: TaskStorage> {
    storage: Arc<S>,
}

impl<S: TaskStorage> TaskQueue<S> {
    pub fn new(storage: S) -> Self {
        Self {
            storage: Arc::new(storage),
        }
    }

    /// Enqueue a task to be processed in the background
    pub async fn enqueue<T: serde::Serialize>(
        &self,
        task_type: String,
        task: T,
    ) -> Result<TaskRecord, TaskError> {
        self.enqueue_with_options(task_type, task, None, 3).await
    }

    /// Enqueue a task with custom options
    pub async fn enqueue_with_options<T: serde::Serialize>(
        &self,
        task_type: String,
        task: T,
        scheduled_for: Option<chrono::DateTime<Utc>>,
        max_attempts: i32,
    ) -> Result<TaskRecord, TaskError> {
        let payload = serde_json::to_value(&task)?;

        let task_record = self
            .storage
            .enqueue(task_type.clone(), payload, scheduled_for, max_attempts)
            .await?;

        debug!(
            "Task enqueued successfully: id={}, type={}",
            task_record.id, task_type
        );

        Ok(task_record)
    }

    /// Find pending tasks ready to be processed
    pub async fn find_pending(&self, limit: usize) -> Result<Vec<TaskRecord>, TaskError> {
        self.storage.find_pending(limit).await
    }

    /// Mark task as processing
    pub async fn mark_processing(&self, id: &str) -> Result<TaskRecord, TaskError> {
        self.storage.mark_processing(id).await
    }

    /// Mark task as completed
    pub async fn mark_completed(&self, id: &str) -> Result<TaskRecord, TaskError> {
        self.storage.mark_completed(id).await
    }

    /// Mark task as failed
    pub async fn mark_failed(&self, id: &str, error: String) -> Result<TaskRecord, TaskError> {
        self.storage.mark_failed(id, error).await
    }

    /// Get task by ID
    pub async fn get_task(&self, id: &str) -> Result<Option<TaskRecord>, TaskError> {
        self.storage.get_task(id).await
    }
}

impl<S: TaskStorage> Clone for TaskQueue<S> {
    fn clone(&self) -> Self {
        Self {
            storage: Arc::clone(&self.storage),
        }
    }
}
