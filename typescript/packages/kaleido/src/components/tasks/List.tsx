import { displayLocalDateTime } from "../../lib/date";
import type { components } from "../../lib/openapi/react-query/api";
import type { PaginatedQueryResult } from "../../lib/paginatedQuery";
import {
  adminTasksSchema,
  type AdminTasksParams,
} from "../../lib/params/adminTasksParams";
import { useAdminTasks } from "../../lib/queries";
import GenericList, { type Column } from "../common/GenericList";

// TODO: fix type
type Task = components["schemas"]["AdminTaskResponse"];

interface ListProps {
  setSelectedTask: (task: Task | null) => void;
}

export default function List({ setSelectedTask }: ListProps) {
  // Wrap the query hook to match PaginatedQueryResult interface
  const useTasksQuery = (
    params: AdminTasksParams,
  ): PaginatedQueryResult<Task> => {
    const { data, raw, isLoading } = useAdminTasks(params);
    return {
      data: data ?? [],
      isLoading,
      raw,
    };
  };

  const columns: Column<Task, AdminTasksParams>[] = [
    { key: "id", header: "ID" },
    { key: "task_type", header: "Type" },
    { key: "status", header: "Status" },
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
  ];

  return (
    <GenericList
      title="Background Tasks"
      paramsSchema={adminTasksSchema}
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
            <option value="running">Running</option>
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
