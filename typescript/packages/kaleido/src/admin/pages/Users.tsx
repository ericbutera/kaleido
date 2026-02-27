import { useState } from "react";
import type { User } from "../../users/useUsers";
import Layout from "../components/Layout";
import { default as List } from "../components/users/List";
import { default as Modal } from "../components/users/Modal";

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
    <Layout title="Users">
      <List onCreateUser={openCreate} onSelectUser={openEdit} />
      <Modal mode={mode} selectedUser={selectedUser} onClose={closeModal} />
    </Layout>
  );
}
