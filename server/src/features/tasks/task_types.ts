export type TaskPriority = "high" | "medium" | "low";

export type TaskData = {
  id: string;
  title: string;
  isChecked: boolean;
  priority: TaskPriority;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
};

export type TaskStore = {
  tasks: TaskData[];
};

export const TASK_PRIORITIES: TaskPriority[] = ["high", "medium", "low"];
