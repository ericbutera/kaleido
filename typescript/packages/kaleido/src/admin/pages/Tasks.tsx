import { useState } from "react";
import type { Task } from "../../tasks/useTasks";
import Layout from "../components/Layout";
import { default as List } from "../components/tasks/List";
import { default as Modal } from "../components/tasks/Modal";

export default function Tasks() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  return (
    <Layout title="Tasks">
      <List setSelectedTask={setSelectedTask} />
      <Modal selectedTask={selectedTask} setSelectedTask={setSelectedTask} />
    </Layout>
  );
}
