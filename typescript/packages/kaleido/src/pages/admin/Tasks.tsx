import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { TasksList, TasksModal } from "../../tasks";
import { Task } from "../../tasks/useTasks";

export default function Tasks() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  return (
    <AdminLayout title="Tasks">
      <TasksList setSelectedTask={setSelectedTask} />
      <TasksModal
        selectedTask={selectedTask}
        setSelectedTask={setSelectedTask}
      />
    </AdminLayout>
  );
}
