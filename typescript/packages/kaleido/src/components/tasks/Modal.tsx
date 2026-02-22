import { displayLocalDateTime } from "../../lib/date";
import type { Task } from "../../tasks/useTasks";
import { useTask } from "../../tasks/useTasks";

interface ModalProps {
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
}

export default function Modal({ selectedTask, setSelectedTask }: ModalProps) {
  const taskId = selectedTask?.id == null ? null : String(selectedTask.id);
  const detailQuery = useTask(taskId);
  const detail = detailQuery.data ?? null;

  if (!selectedTask) return null;

  const payload =
    (detail as any)?.payload ?? (selectedTask as any).payload ?? null;

  return (
    <div
      className="modal modal-open"
      role="dialog"
      onClick={() => setSelectedTask(null)}
    >
      <div className="modal-box max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg">
          Task #{selectedTask.id} — {selectedTask.task_type}
        </h3>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm items-start">
          <div>
            <strong>Status:</strong> {selectedTask.status}
          </div>

          <div>
            <strong>Attempts:</strong> {selectedTask.attempts}/
            {selectedTask.max_attempts}
          </div>

          <div>
            <strong>Scheduled:</strong> {selectedTask.scheduled_for ?? "—"}
          </div>

          <div>
            <strong>Error:</strong>
            <div className="whitespace-pre-wrap">
              {selectedTask.error ?? "—"}
            </div>
          </div>

          <div>
            <strong>Started:</strong>{" "}
            {displayLocalDateTime(selectedTask.started_at)}
          </div>

          <div>
            <strong>Completed:</strong>{" "}
            {displayLocalDateTime(selectedTask.completed_at)}
          </div>

          <div>
            <strong>Created:</strong>{" "}
            {displayLocalDateTime(selectedTask.created_at)}
          </div>

          <div>
            <strong>Updated:</strong>{" "}
            {displayLocalDateTime(selectedTask.updated_at)}
          </div>
        </div>

        <div className="mt-4 w-full">
          <strong>Payload:</strong>
          <pre className="w-full max-w-full bg-base-200 p-2 rounded max-h-48 overflow-auto whitespace-pre text-xs mt-1">
            {(() => {
              const p = payload;
              if (p == null) return "—";
              try {
                const parsed = typeof p === "string" ? JSON.parse(p) : p;
                return JSON.stringify(parsed ?? "—", null, 2);
              } catch (e) {
                return typeof p === "string" ? p : JSON.stringify(p);
              }
            })()}
          </pre>
        </div>
        <div className="modal-action">
          <button className="btn" onClick={() => setSelectedTask(null)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
