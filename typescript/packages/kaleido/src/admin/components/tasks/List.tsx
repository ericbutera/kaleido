import {
  faBan,
  faGear,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { MouseEvent } from "react";
import { GenericList, type Column } from "../../../components";
import { displayLocalDateTime } from "../../../lib/date";
import type { PaginatedQueryResult } from "../../../lib/paginatedQuery";
import type { Task } from "../../../tasks/useTasks";
import {
  useCancelTask,
  useRerunTask,
  useTasks,
} from "../../../tasks/useTasks";
import { TasksSchema, type TasksParams } from "../../params/TasksParams";

interface ListProps {
  setSelectedTask: (task: Task | null) => void;
}

type TaskWithDuration = Task & {
  duration_ms?: number | null;
  duration_trend?: "slower" | "normal";
  duration_baseline_ms?: number | null;
};

function parseTimestamp(value?: string | null) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function getDurationMs(task: Task) {
  const started = parseTimestamp(task.started_at);
  if (!started) return null;

  const finished =
    parseTimestamp(task.completed_at) ??
    (task.status === "processing" || task.status === "running"
      ? Date.now()
      : parseTimestamp(task.updated_at));

  if (!finished || finished < started) return null;
  return finished - started;
}

function formatDuration(durationMs?: number | null) {
  if (durationMs == null) return "";
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function enhanceTasks(tasks: Task[]): TaskWithDuration[] {
  const enhanced = tasks.map((task) => ({
    ...task,
    duration_ms: getDurationMs(task),
    duration_trend: "normal" as const,
    duration_baseline_ms: null,
  }));

  const byType = new Map<string, TaskWithDuration[]>();
  for (const task of enhanced) {
    if (
      !task.task_type ||
      task.status !== "completed" ||
      task.duration_ms == null
    ) {
      continue;
    }

    const group = byType.get(task.task_type) ?? [];
    group.push(task);
    byType.set(task.task_type, group);
  }

  for (const group of byType.values()) {
    const ordered = [...group].sort((a, b) => {
      const aTime = parseTimestamp(a.started_at) ?? parseTimestamp(a.created_at) ?? 0;
      const bTime = parseTimestamp(b.started_at) ?? parseTimestamp(b.created_at) ?? 0;
      return aTime - bTime;
    });

    ordered.forEach((task, index) => {
      if (index < 2 || task.duration_ms == null) return;
      const previous = ordered.slice(0, index);
      const baseline =
        previous.reduce((sum, item) => sum + (item.duration_ms ?? 0), 0) /
        previous.length;

      if (baseline > 0 && task.duration_ms > baseline * 1.5) {
        task.duration_trend = "slower";
        task.duration_baseline_ms = baseline;
      }
    });
  }

  return enhanced;
}

export default function List({ setSelectedTask }: ListProps) {
  const rerunTask = useRerunTask();
  const cancelTask = useCancelTask();

  // Wrap the configured tasks hook to match PaginatedQueryResult interface
  const useTasksQuery = (
    params: TasksParams,
  ): PaginatedQueryResult<TaskWithDuration> => {
    const { data, raw, isLoading } = useTasks(params);
    return {
      data: enhanceTasks(data ?? []),
      isLoading,
      raw,
    };
  };

  const runTaskAction = async (
    event: MouseEvent,
    action: "rerun" | "cancel",
    task: TaskWithDuration,
  ) => {
    event.stopPropagation();
    if (action === "rerun") {
      await rerunTask.mutateAsync({ id: task.id });
    } else {
      await cancelTask.mutateAsync({ id: task.id });
    }
  };

  const columns: Column<TaskWithDuration, TasksParams>[] = [
    { key: "id", header: "ID" },
    { key: "task_type", header: "Type" },
    { key: "status", header: "Status" },
    {
      key: "duration",
      header: "Duration",
      render: (t) => (
        <span title={t.duration_ms ? `${Math.round(t.duration_ms / 1000)}s` : ""}>
          {formatDuration(t.duration_ms)}
        </span>
      ),
    },
    {
      key: "duration_trend",
      header: "Trend",
      render: (t) =>
        t.duration_trend === "slower" ? (
          <span
            className="badge badge-warning badge-sm whitespace-nowrap"
            title={`Slower than visible baseline ${formatDuration(
              t.duration_baseline_ms,
            )}`}
          >
            Slower
          </span>
        ) : (
          <span className="text-base-content/50">-</span>
        ),
    },
    {
      key: "attempts",
      header: "Attempts",
      render: (t) => (
        <span>
          {t.attempts}/{t.max_attempts}
        </span>
      ),
    },
    {
      key: "error",
      header: "Error",
      className: "max-w-xs truncate",
      render: (t) => <span title={t.error || ""}>{t.error}</span>,
    },
    {
      key: "created_at",
      header: "Created",
      render: (t) => displayLocalDateTime(t.created_at),
    },
    {
      key: "actions",
      header: "",
      className: "w-12 text-right",
      render: (t) => {
        const canCancel = t.status === "processing" || t.status === "running";
        const isPending = rerunTask.isPending || cancelTask.isPending;

        return (
          <div
            className="dropdown dropdown-end"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              tabIndex={0}
              className="btn btn-ghost btn-xs"
              aria-label={`Task ${t.id} actions`}
            >
              <FontAwesomeIcon icon={faGear} />
            </button>
            <ul
              tabIndex={0}
              className="dropdown-content menu z-20 mt-2 w-40 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
            >
              <li>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={(event) => runTaskAction(event, "rerun", t)}
                >
                  <FontAwesomeIcon icon={faRotateRight} />
                  Rerun
                </button>
              </li>
              {canCancel && (
                <li>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={(event) => runTaskAction(event, "cancel", t)}
                  >
                    <FontAwesomeIcon icon={faBan} />
                    Cancel
                  </button>
                </li>
              )}
            </ul>
          </div>
        );
      },
    },
  ];

  return (
    <GenericList
      title="Background Tasks"
      paramsSchema={TasksSchema}
      useQuery={useTasksQuery}
      columns={columns}
      onRowClick={setSelectedTask}
      renderFilters={(params, setFilter) => (
        <>
          <input
            type="search"
            placeholder="Filter error text"
            // set width to smaller size
            className="input input-sm input-bordered w-40"
            value={params.q || ""}
            onChange={(e) => setFilter("q", e.target.value)}
          />
          <select
            className="select select-sm select-bordered w-40"
            value={params.task_type || ""}
            onChange={(e) => setFilter("task_type", e.target.value)}
          >
            <option value="">All Types</option>
            <option value="email_registration">Email Registration</option>
            <option value="email_password_reset">Email Password Reset</option>
            <option value="email_notification">Email Notification</option>
            <option value="resize_image">Resize Image</option>
            <option value="zip_import">Zip Import</option>
          </select>
          <select
            className="select select-sm select-bordered w-40"
            value={params.status || ""}
            onChange={(e) => setFilter("status", e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="running">Running</option>
            <option value="canceled">Canceled</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <input
            type="date"
            title="From"
            className="input input-sm input-bordered w-40"
            value={params.from_date ? params.from_date.split("T")[0] : ""}
            onChange={(e) => {
              const date = e.target.value
                ? new Date(e.target.value).toISOString()
                : undefined;
              setFilter("from_date", date);
            }}
          />
          <input
            type="date"
            title="To"
            className="input input-sm input-bordered w-40"
            value={params.to_date ? params.to_date.split("T")[0] : ""}
            onChange={(e) => {
              const date = e.target.value
                ? new Date(e.target.value).toISOString()
                : undefined;
              setFilter("to_date", date);
            }}
          />
        </>
      )}
      emptyMessage="No tasks found matching criteria."
    />
  );
}
