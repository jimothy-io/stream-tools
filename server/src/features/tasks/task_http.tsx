import { render } from "preact-render-to-string";
import { TaskApp } from "../../ui/task_app.tsx";
import { TaskNotFoundError, TaskService } from "./task_service.ts";
import {
  TASK_PRIORITIES,
  type TaskData,
  type TaskPriority,
} from "./task_types.ts";

export function createTaskHttpHandler(taskService: TaskService) {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const { pathname } = url;

    if (request.method === "GET" && pathname === "/") {
      const tasks = await taskService.listTasks();
      return htmlResponse(renderDocument(tasks));
    }

    if (request.method === "POST" && pathname === "/tasks") {
      const form = await request.formData();
      const title = String(form.get("title") ?? "");
      const priority = String(form.get("priority") ?? "medium") as TaskPriority;

      try {
        await taskService.addTask({ title, priority });
        return redirect("/");
      } catch (error) {
        return htmlErrorResponse(error, 400);
      }
    }

    const togglePageMatch = pathname.match(/^\/tasks\/([^/]+)\/toggle$/);
    if (request.method === "POST" && togglePageMatch) {
      try {
        await taskService.toggleTask(togglePageMatch[1]);
        return redirect("/");
      } catch (error) {
        return taskErrorResponse(error);
      }
    }

    const deletePageMatch = pathname.match(/^\/tasks\/([^/]+)\/delete$/);
    if (request.method === "POST" && deletePageMatch) {
      try {
        await taskService.deleteTask(deletePageMatch[1]);
        return redirect("/");
      } catch (error) {
        return taskErrorResponse(error);
      }
    }

    if (request.method === "GET" && pathname === "/api/tasks") {
      const tasks = await taskService.listTasks();
      return jsonResponse({ tasks });
    }

    if (request.method === "POST" && pathname === "/api/tasks") {
      try {
        const body = await request.json() as {
          title?: string;
          priority?: string;
        };

        const task = await taskService.addTask({
          title: body.title ?? "",
          priority: (body.priority ?? "medium") as TaskPriority,
        });

        return jsonResponse({ task }, 201);
      } catch (error) {
        return jsonErrorResponse(error, 400);
      }
    }

    const toggleApiMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/toggle$/);
    if (request.method === "POST" && toggleApiMatch) {
      try {
        const task = await taskService.toggleTask(toggleApiMatch[1]);
        return jsonResponse({ task });
      } catch (error) {
        return taskJsonErrorResponse(error);
      }
    }

    const deleteApiMatch = pathname.match(/^\/api\/tasks\/([^/]+)$/);
    if (request.method === "DELETE" && deleteApiMatch) {
      try {
        await taskService.deleteTask(deleteApiMatch[1]);
        return jsonResponse({ ok: true });
      } catch (error) {
        return taskJsonErrorResponse(error);
      }
    }

    return new Response("Not found", { status: 404 });
  };
}

function renderDocument(tasks: TaskData[]): string {
  const app = render(<TaskApp tasks={tasks} priorities={TASK_PRIORITIES} />);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>OBS Todo</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: "Avenir Next", "Segoe UI", sans-serif;
        background: #101820;
        color: #f3f7f0;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at top, rgba(95, 193, 255, 0.16), transparent 34%),
          linear-gradient(180deg, #101820 0%, #13232e 100%);
      }

      button,
      input,
      select {
        font: inherit;
      }

      button {
        cursor: pointer;
      }
    </style>
  </head>
  <body>${app}</body>
</html>`;
}

function htmlResponse(body: string): Response {
  return new Response(body, {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

function redirect(location: string): Response {
  return new Response(null, {
    status: 303,
    headers: { location },
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function jsonErrorResponse(error: unknown, status = 400): Response {
  return jsonResponse({ error: errorMessage(error) }, status);
}

function htmlErrorResponse(error: unknown, status = 400): Response {
  return new Response(errorMessage(error), { status });
}

function taskErrorResponse(error: unknown): Response {
  if (error instanceof TaskNotFoundError) {
    return htmlErrorResponse(error, 404);
  }

  return htmlErrorResponse(error, 400);
}

function taskJsonErrorResponse(error: unknown): Response {
  if (error instanceof TaskNotFoundError) {
    return jsonErrorResponse(error, 404);
  }

  return jsonErrorResponse(error, 400);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}
