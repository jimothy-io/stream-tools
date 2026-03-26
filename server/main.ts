import { createTaskHttpHandler } from "./src/features/tasks/task_http.tsx";
import { JsonTaskRepository } from "./src/features/tasks/task_repository.ts";
import { TaskService } from "./src/features/tasks/task_service.ts";

const repository = new JsonTaskRepository(
  new URL("./data/tasks.json", import.meta.url),
);
const taskService = new TaskService(repository);
const handler = createTaskHttpHandler(taskService);

if (import.meta.main) {
  Deno.serve({ port: 8000 }, handler);
}
