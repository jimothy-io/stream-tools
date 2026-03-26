import { TaskPriority } from "../src/features/tasks/task_types.ts";

export const uiConfig = {
  tasks: {
    showCompletedStrikeThrough: false,
  },
  priorityColors: {
    low: "#85888d",
    medium: "#fbbf24",
    high: "#f87171",
  } satisfies Record<TaskPriority, string>,
} as const;
