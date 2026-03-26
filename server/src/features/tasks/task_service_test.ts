import { assertEquals, assertRejects } from "@std/assert";
import { JsonTaskRepository } from "./task_repository.ts";
import { TaskNotFoundError, TaskService } from "./task_service.ts";

Deno.test("JsonTaskRepository initializes missing file and loads saved tasks", async () => {
  const directory = await Deno.makeTempDir();
  const fileUrl = new URL(`file://${directory}/tasks.json`);
  const repository = new JsonTaskRepository(fileUrl);

  const initialTasks = await repository.initialize();
  assertEquals(initialTasks, []);

  const raw = await Deno.readTextFile(fileUrl);
  assertEquals(raw, '{\n  "tasks": []\n}\n');

  const service = new TaskService(repository);
  const created = await service.addTask({
    title: "Persisted task",
    priority: "medium",
  });

  const reloadedRepository = new JsonTaskRepository(fileUrl);
  const reloadedTasks = await reloadedRepository.initialize();

  assertEquals(reloadedTasks.length, 1);
  assertEquals(reloadedTasks[0].id, created.id);
  assertEquals(reloadedTasks[0].title, created.title);
});

Deno.test("TaskService adds, lists, toggles, and deletes tasks", async () => {
  const repository = await createRepository();
  const service = new TaskService(repository);

  const task = await service.addTask({
    title: "Ship the first vertical slice",
    priority: "high",
  });

  let tasks = await service.listTasks();
  assertEquals(tasks.length, 1);
  assertEquals(tasks[0].id, task.id);
  assertEquals(tasks[0].isChecked, false);
  assertEquals(tasks[0].completedAt, null);

  const toggled = await service.toggleTask(task.id);
  assertEquals(toggled.isChecked, true);
  assertEquals(typeof toggled.completedAt, "number");

  tasks = await service.listTasks();
  assertEquals(tasks[0].isChecked, true);

  await service.deleteTask(task.id);
  tasks = await service.listTasks();
  assertEquals(tasks, []);
});

Deno.test("TaskService rejects missing tasks", async () => {
  const repository = await createRepository();
  const service = new TaskService(repository);

  await assertRejects(
    () => service.toggleTask("missing"),
    TaskNotFoundError,
  );

  await assertRejects(
    () => service.deleteTask("missing"),
    TaskNotFoundError,
  );
});

Deno.test("TaskService validates input", async () => {
  const repository = await createRepository();
  const service = new TaskService(repository);

  await assertRejects(
    () => service.addTask({ title: "   ", priority: "medium" }),
    Error,
    "Task title is required.",
  );

  await assertRejects(
    () =>
      service.addTask({ title: "Bad priority", priority: "urgent" as never }),
    Error,
    "Invalid task priority: urgent",
  );
});

Deno.test("TaskService notifies subscribers after mutations", async () => {
  const repository = await createRepository();
  const service = new TaskService(repository);
  const snapshots: number[] = [];

  const unsubscribe = service.subscribe((tasks) => {
    snapshots.push(tasks.length);
  });

  const task = await service.addTask({
    title: "Live task",
    priority: "low",
  });
  await service.toggleTask(task.id);
  await service.deleteTask(task.id);
  unsubscribe();

  assertEquals(snapshots, [1, 1, 0]);
});

async function createRepository(): Promise<JsonTaskRepository> {
  const directory = await Deno.makeTempDir();
  return new JsonTaskRepository(new URL(`file://${directory}/tasks.json`));
}
