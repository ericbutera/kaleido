import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { UsersList, UsersModal } from "../../users";
import type { User } from "../../users/useUsers";

export default function Users() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [mode, setMode] = useState<"create" | "edit" | null>(null);

  const openCreate = () => {
    setSelectedUser(null);
    setMode("create");
  };

  const openEdit = (user: User) => {
    setSelectedUser(user);
    setMode("edit");
  };

  const closeModal = () => {
    setSelectedUser(null);
    setMode(null);
  };

  return (
    <AdminLayout title="Users">
      <UsersList onCreateUser={openCreate} onSelectUser={openEdit} />
      <UsersModal
        mode={mode}
        selectedUser={selectedUser}
        onClose={closeModal}
      />
    </AdminLayout>
  );
}
