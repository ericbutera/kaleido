use crate::worker::metrics::WorkerMetrics;
use crate::worker::processor::TaskProcessor;
use crate::background_tasks;
use sea_orm::DatabaseConnection;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tracing::{debug, error};

pub type WorkerError = Box<dyn std::error::Error + Send + Sync>;

pub struct TaskWorker {
    db: DatabaseConnection,
    batch_size: u64,
    poll_interval: Duration,
    processors: HashMap<String, Arc<dyn TaskProcessor>>,
    metrics: Option<Arc<WorkerMetrics>>,
}

impl TaskWorker {
    pub fn new(db: DatabaseConnection) -> Self {
        Self {
            db,
            batch_size: 10,
            poll_interval: Duration::from_secs(1),
            processors: HashMap::new(),
            metrics: None,
        }
    }

    pub fn with_batch_size(mut self, batch_size: u64) -> Self {
        self.batch_size = batch_size;
        self
    }

    pub fn with_poll_interval(mut self, poll_interval: Duration) -> Self {
        self.poll_interval = poll_interval;
        self
    }

    pub fn with_metrics(mut self, metrics: Arc<WorkerMetrics>) -> Self {
        self.metrics = Some(metrics);
        self
    }

    pub fn register_processor(mut self, processor: Arc<dyn TaskProcessor>) -> Self {
        self.processors
            .insert(processor.task_type().to_string(), processor);
        self
    }

    pub fn registered_task_types(&self) -> Vec<String> {
        self.processors.keys().cloned().collect()
    }

    pub async fn run(self) {
        debug!(
            "Task worker started (batch_size={}, poll_interval={:?}, processors={})",
            self.batch_size,
            self.poll_interval,
            self.processors.len()
        );

        let mut current_interval = self.poll_interval;
        let max_backoff = Duration::from_secs(60);

        loop {
            match self.process_batch().await {
                Ok(processed) if processed > 0 => {
                    current_interval = self.poll_interval;
                }
                Ok(_) => {
                    tokio::time::sleep(current_interval).await;
                    let secs = current_interval
                        .as_secs()
                        .saturating_mul(2)
                        .min(max_backoff.as_secs())
                        .max(1);
                    current_interval = Duration::from_secs(secs);
                }
                Err(worker_error) => {
                    error!(%worker_error, "Error processing task batch");
                    tokio::time::sleep(current_interval).await;
                    let secs = current_interval
                        .as_secs()
                        .saturating_mul(2)
                        .min(max_backoff.as_secs())
                        .max(1);
                    current_interval = Duration::from_secs(secs);
                }
            }
        }
    }

    async fn process_batch(&self) -> Result<usize, WorkerError> {
        let tasks = background_tasks::Model::find_pending(&self.db, self.batch_size).await?;
        let count = tasks.len();

        for task_model in tasks {
            if let Err(worker_error) = self.process_task(task_model).await {
                error!(%worker_error, "Failed to process task");
            }
        }

        Ok(count)
    }

    async fn process_task(&self, task_model: background_tasks::Model) -> Result<(), WorkerError> {
        let task_type = task_model.task_type.as_str();

        if let Some(metrics) = &self.metrics {
            metrics.record_invocation(task_type);
            let lag_seconds = (chrono::Utc::now() - task_model.created_at).num_milliseconds() as f64 / 1000.0;
            metrics.record_processing_lag(task_type, lag_seconds);
        }

        let task_model = task_model.mark_processing(&self.db).await?;
        let started_at = std::time::Instant::now();

        let result = match self.processors.get(task_type) {
            Some(processor) => processor
                .process(task_model.id, task_model.payload.clone())
                .await,
            None => Err(format!("No processor registered for task type: {}", task_type).into()),
        };

        if let Some(metrics) = &self.metrics {
            metrics.record_duration(task_type, started_at.elapsed().as_secs_f64());
        }

        match result {
            Ok(_) => {
                task_model.mark_completed(&self.db).await?;
                if let Some(metrics) = &self.metrics {
                    metrics.record_completed(task_type);
                }
            }
            Err(process_error) => {
                task_model
                    .mark_failed(&self.db, process_error.to_string())
                    .await?;
                if let Some(metrics) = &self.metrics {
                    metrics.record_failed(task_type);
                }
            }
        }

        Ok(())
    }
}
