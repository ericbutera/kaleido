import AdminLayout from "@/components/admin/AdminLayout";
import List from "@/components/admin/tasks/List";
import Modal from "@/components/admin/tasks/Modal";
import type { components } from "@/lib/openapi/react-query/api";
import { useState } from "react";

export default function Tasks() {
  type Task = components["schemas"]["AdminTaskResponse"];
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  return (
    <AdminLayout title="Tasks">
      <List setSelectedTask={setSelectedTask} />
      <Modal selectedTask={selectedTask} setSelectedTask={setSelectedTask} />
    </AdminLayout>
  );
}
