import { GenericList, type Column } from "../../../components";
import type { PaginatedQueryResult } from "../../../lib/paginatedQuery";
import type { User } from "../../../users/useUsers";
import { useUsers } from "../../../users/useUsers";
import { UsersSchema, type UsersParams } from "../../params/UsersParams";

interface ListProps {
  onCreateUser: () => void;
  onSelectUser: (user: User) => void;
}

function isUserDisabled(user: User): boolean {
  return !!(user.disabled ?? user.is_disabled ?? user.active === false);
}

function isUserVerified(user: User): boolean {
  return !!(user.verified ?? user.email_verified_at);
}

export default function List({ onCreateUser, onSelectUser }: ListProps) {
  const useUsersQuery = (params: UsersParams): PaginatedQueryResult<User> => {
    const { data, raw, isLoading } = useUsers(params);
    return {
      data: data ?? [],
      isLoading,
      raw,
    };
  };

  const columns: Column<User, UsersParams>[] = [
    { key: "id", header: "ID" },
    {
      key: "email",
      header: "Email",
      className: "max-w-xs truncate",
      render: (user) => (
        <span title={String(user.email ?? "")}>{user.email}</span>
      ),
    },
    {
      key: "name",
      header: "Name",
      className: "max-w-xs truncate",
      render: (user) => (
        <span title={String(user.name ?? "")}>{user.name ?? "—"}</span>
      ),
    },
    {
      key: "verified",
      header: "Verified",
      render: (user) => (
        <span
          className={`badge ${isUserVerified(user) ? "badge-success" : "badge-warning"}`}
        >
          {isUserVerified(user) ? "Verified" : "Unverified"}
        </span>
      ),
    },
    {
      key: "disabled",
      header: "Status",
      render: (user) => (
        <span
          className={`badge ${isUserDisabled(user) ? "badge-error" : "badge-success"}`}
        >
          {isUserDisabled(user) ? "Disabled" : "Active"}
        </span>
      ),
    },
  ];

  return (
    <GenericList
      title="Users"
      actions={
        <button className="btn btn-sm btn-primary" onClick={onCreateUser}>
          Create User
        </button>
      }
      paramsSchema={UsersSchema}
      useQuery={useUsersQuery}
      columns={columns}
      onRowClick={onSelectUser}
      renderFilters={(params, setFilter) => (
        <>
          <input
            type="search"
            placeholder="Search name or email"
            className="input input-sm input-bordered w-56"
            value={params.q || ""}
            onChange={(e) => setFilter("q", e.target.value)}
          />
          <select
            className="select select-sm select-bordered w-40"
            value={params.disabled || ""}
            onChange={(e) => setFilter("disabled", e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="false">Active</option>
            <option value="true">Disabled</option>
          </select>
        </>
      )}
      emptyMessage="No users found matching criteria."
    />
  );
}
