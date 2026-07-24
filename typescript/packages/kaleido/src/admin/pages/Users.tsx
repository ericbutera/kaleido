import { useState } from "react";
import type { User } from "../../users/useUsers";
import { default as List } from "../components/users/List";
import { default as Modal } from "../components/users/Modal";

export default function Users() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const openEdit = (user: User) => {
    setSelectedUser(user);
  };

  const closeModal = () => {
    setSelectedUser(null);
  };

  return (
    <>
      <List onSelectUser={openEdit} />
      <Modal selectedUser={selectedUser} onClose={closeModal} />
    </>
  );
}
