import { JsonTaskRepository } from "./task_repository.ts";
import {
  TASK_PRIORITIES,
  type TaskData,
  type TaskPriority,
} from "./task_types.ts";

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export class TaskService {
  #repository: JsonTaskRepository;

  constructor(repository: JsonTaskRepository) {
    this.#repository = repository;
  }

  async listTasks(): Promise<TaskData[]> {
    const tasks = await this.#repository.list();
    return tasks.sort(compareTasks);
  }

  async addTask(input: {
    title: string;
    priority: TaskPriority;
  }): Promise<TaskData> {
    const now = Date.now();
    const task: TaskData = {
      id: crypto.randomUUID(),
      title: normalizeTitle(input.title),
      isChecked: false,
      priority: parsePriority(input.priority),
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };

    const tasks = await this.#repository.list();
    tasks.push(task);
    await this.#repository.saveAll(tasks);
    return task;
  }

  async toggleTask(id: string): Promise<TaskData> {
    const tasks = await this.#repository.list();
    const task = tasks.find((item) => item.id === id);
    if (!task) {
      throw new TaskNotFoundError(id);
    }

    const now = Date.now();
    task.isChecked = !task.isChecked;
    task.updatedAt = now;
    task.completedAt = task.isChecked ? now : null;

    await this.#repository.saveAll(tasks);
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    const tasks = await this.#repository.list();
    const nextTasks = tasks.filter((task) => task.id !== id);

    if (nextTasks.length === tasks.length) {
      throw new TaskNotFoundError(id);
    }

    await this.#repository.saveAll(nextTasks);
  }
}

export class TaskNotFoundError extends Error {
  constructor(id: string) {
    super(`Task not found: ${id}`);
    this.name = "TaskNotFoundError";
  }
}

function normalizeTitle(title: string): string {
  const normalized = title.trim();
  if (!normalized) {
    throw new Error("Task title is required.");
  }

  return normalized;
}

function parsePriority(priority: string): TaskPriority {
  if (TASK_PRIORITIES.includes(priority as TaskPriority)) {
    return priority as TaskPriority;
  }

  throw new Error(`Invalid task priority: ${priority}`);
}

function compareTasks(a: TaskData, b: TaskData): number {
  if (a.isChecked !== b.isChecked) {
    return a.isChecked ? 1 : -1;
  }

  if (a.priority !== b.priority) {
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  }

  return b.createdAt - a.createdAt;
}
