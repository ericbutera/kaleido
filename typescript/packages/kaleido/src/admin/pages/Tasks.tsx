import { useState } from "react";
import type { Task } from "../../tasks/useTasks";
import { default as List } from "../components/tasks/List";
import { default as Modal } from "../components/tasks/Modal";

export default function Tasks() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  return (
    <>
      <List setSelectedTask={setSelectedTask} />
      <Modal selectedTask={selectedTask} setSelectedTask={setSelectedTask} />
    </>
  );
}
