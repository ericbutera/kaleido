// In-memory task storage implementation
//
// This is a simple, non-persistent storage suitable for development
// and testing. Tasks are stored in memory and will be lost on restart.

use crate::error::TaskError;
use crate::storage::{TaskRecord, TaskStatus, TaskStorage};
use async_trait::async_trait;
use chrono::Utc;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct InMemoryStorage {
    tasks: Arc<RwLock<Vec<TaskRecord>>>,
}

impl InMemoryStorage {
    pub fn new() -> Self {
        Self {
            tasks: Arc::new(RwLock::new(Vec::new())),
        }
    }
}

impl Default for InMemoryStorage {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl TaskStorage for InMemoryStorage {
    async fn enqueue(
        &self,
        task_type: String,
        payload: serde_json::Value,
        scheduled_for: Option<chrono::DateTime<Utc>>,
        max_attempts: i32,
    ) -> Result<TaskRecord, TaskError> {
        let task = TaskRecord {
            id: Uuid::new_v4().to_string(),
            task_type,
            payload,
            status: TaskStatus::Pending,
            attempts: 0,
            max_attempts,
            error: None,
            scheduled_for,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            started_at: None,
            completed_at: None,
        };

        let mut tasks = self.tasks.write().await;
        tasks.push(task.clone());

        Ok(task)
    }

    async fn find_pending(&self, limit: usize) -> Result<Vec<TaskRecord>, TaskError> {
        let tasks = self.tasks.read().await;
        let now = Utc::now();

        let pending: Vec<TaskRecord> = tasks
            .iter()
            .filter(|t| {
                t.status == TaskStatus::Pending
                    && (t.scheduled_for.is_none() || t.scheduled_for.unwrap() <= now)
            })
            .take(limit)
            .cloned()
            .collect();

        Ok(pending)
    }

    async fn mark_processing(&self, id: &str) -> Result<TaskRecord, TaskError> {
        let mut tasks = self.tasks.write().await;
        let task = tasks
            .iter_mut()
            .find(|t| t.id == id)
            .ok_or(TaskError::NotFound)?;

        task.status = TaskStatus::Processing;
        task.started_at = Some(Utc::now());
        task.attempts += 1;
        task.updated_at = Utc::now();

        Ok(task.clone())
    }

    async fn mark_completed(&self, id: &str) -> Result<TaskRecord, TaskError> {
        let mut tasks = self.tasks.write().await;
        let task = tasks
            .iter_mut()
            .find(|t| t.id == id)
            .ok_or(TaskError::NotFound)?;

        task.status = TaskStatus::Completed;
        task.completed_at = Some(Utc::now());
        task.updated_at = Utc::now();

        Ok(task.clone())
    }

    async fn mark_failed(&self, id: &str, error: String) -> Result<TaskRecord, TaskError> {
        let mut tasks = self.tasks.write().await;
        let task = tasks
            .iter_mut()
            .find(|t| t.id == id)
            .ok_or(TaskError::NotFound)?;

        task.error = Some(error);
        task.updated_at = Utc::now();

        // If max attempts reached, mark as failed, otherwise mark as pending for retry
        if task.attempts >= task.max_attempts {
            task.status = TaskStatus::Failed;
        } else {
            task.status = TaskStatus::Pending;
        }

        Ok(task.clone())
    }

    async fn get_task(&self, id: &str) -> Result<Option<TaskRecord>, TaskError> {
        let tasks = self.tasks.read().await;
        Ok(tasks.iter().find(|t| t.id == id).cloned())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[tokio::test]
    async fn test_enqueue_and_find_pending() {
        let storage = InMemoryStorage::new();

        let task = storage
            .enqueue(
                "test_task".to_string(),
                json!({"foo": "bar"}),
                None,
                3,
            )
            .await
            .unwrap();

        assert_eq!(task.task_type, "test_task");
        assert_eq!(task.status, TaskStatus::Pending);
        assert_eq!(task.attempts, 0);

        let pending = storage.find_pending(10).await.unwrap();
        assert_eq!(pending.len(), 1);
        assert_eq!(pending[0].id, task.id);
    }

    #[tokio::test]
    async fn test_mark_processing() {
        let storage = InMemoryStorage::new();

        let task = storage
            .enqueue(
                "test_task".to_string(),
                json!({"foo": "bar"}),
                None,
                3,
            )
            .await
            .unwrap();

        let updated = storage.mark_processing(&task.id).await.unwrap();
        assert_eq!(updated.status, TaskStatus::Processing);
        assert_eq!(updated.attempts, 1);
        assert!(updated.started_at.is_some());
    }

    #[tokio::test]
    async fn test_mark_completed() {
        let storage = InMemoryStorage::new();

        let task = storage
            .enqueue(
                "test_task".to_string(),
                json!({"foo": "bar"}),
                None,
                3,
            )
            .await
            .unwrap();

        storage.mark_processing(&task.id).await.unwrap();
        let updated = storage.mark_completed(&task.id).await.unwrap();

        assert_eq!(updated.status, TaskStatus::Completed);
        assert!(updated.completed_at.is_some());
    }

    #[tokio::test]
    async fn test_mark_failed_with_retry() {
        let storage = InMemoryStorage::new();

        let task = storage
            .enqueue(
                "test_task".to_string(),
                json!({"foo": "bar"}),
                None,
                3,
            )
            .await
            .unwrap();

        storage.mark_processing(&task.id).await.unwrap();
        let updated = storage
            .mark_failed(&task.id, "test error".to_string())
            .await
            .unwrap();

        // Should be pending for retry since attempts (1) < max_attempts (3)
        assert_eq!(updated.status, TaskStatus::Pending);
        assert_eq!(updated.error, Some("test error".to_string()));
    }

    #[tokio::test]
    async fn test_mark_failed_max_attempts() {
        let storage = InMemoryStorage::new();

        let task = storage
            .enqueue(
                "test_task".to_string(),
                json!({"foo": "bar"}),
                None,
                1,
            )
            .await
            .unwrap();

        storage.mark_processing(&task.id).await.unwrap();
        let updated = storage
            .mark_failed(&task.id, "test error".to_string())
            .await
            .unwrap();

        // Should be failed since attempts (1) >= max_attempts (1)
        assert_eq!(updated.status, TaskStatus::Failed);
    }
}
