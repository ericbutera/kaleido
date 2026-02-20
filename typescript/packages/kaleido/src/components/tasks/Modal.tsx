import { displayLocalDateTime } from "../../lib/date";
import type { components } from "../../lib/openapi/react-query/api";
import { useAdminTask } from "../../lib/queries";

interface ModalProps {
  selectedTask: components["schemas"]["AdminTaskResponse"] | null; // TODO: fix type
  setSelectedTask: (
    task: components["schemas"]["AdminTaskResponse"] | null,
  ) => void;
}

export default function Modal({ selectedTask, setSelectedTask }: ModalProps) {
  const detailQuery = useAdminTask(selectedTask?.id);
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
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
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
          <div className="col-span-2">
            <strong>Error:</strong>
            <div className="whitespace-pre-wrap">
              {selectedTask.error ?? "—"}
            </div>
          </div>
          <div className="col-span-2">
            <strong>Payload:</strong>
            <pre className="bg-base-200 p-2 rounded max-h-48 overflow-auto text-xs">
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
