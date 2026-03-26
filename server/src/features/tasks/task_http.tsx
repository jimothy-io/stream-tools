import { render } from "preact-render-to-string";
import { TaskApp } from "../../ui/task_app.tsx";
import { TaskNotFoundError, TaskService } from "./task_service.ts";
import {
  TASK_PRIORITIES,
  type TaskData,
  type TaskPriority,
} from "./task_types.ts";

const TASK_EDIT_ROUTE = "/tasks-edit";
const TASKS_DISPLAY_ROUTE = "/tasks";
const TASK_EVENTS_ROUTE = "/api/tasks/events";

export function createTaskHttpHandler(taskService: TaskService) {
  const sse = createTaskEventStream(taskService);

  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const { pathname } = url;

    if (request.method === "GET" && pathname === "/") {
      return redirect(TASK_EDIT_ROUTE);
    }

    if (request.method === "GET" && pathname === TASK_EDIT_ROUTE) {
      const tasks = await taskService.listTasks();
      return htmlResponse(renderDocument(tasks, {
        editable: true,
        editorEnhancements: true,
        variant: "editor",
      }));
    }

    if (request.method === "GET" && pathname === TASKS_DISPLAY_ROUTE) {
      const tasks = await taskService.listTasks();
      return htmlResponse(renderDocument(tasks, {
        editable: false,
        liveUpdates: true,
        variant: "obs",
      }));
    }

    if (request.method === "POST" && pathname === TASKS_DISPLAY_ROUTE) {
      const form = await request.formData();
      const title = String(form.get("title") ?? "");
      const priority = String(form.get("priority") ?? "medium") as TaskPriority;

      try {
        await taskService.addTask({ title, priority });
        return redirect(TASK_EDIT_ROUTE);
      } catch (error) {
        return htmlErrorResponse(error, 400);
      }
    }

    const togglePageMatch = pathname.match(/^\/tasks\/([^/]+)\/toggle$/);
    if (request.method === "POST" && togglePageMatch) {
      try {
        await taskService.toggleTask(togglePageMatch[1]);
        return redirect(TASK_EDIT_ROUTE);
      } catch (error) {
        return taskErrorResponse(error);
      }
    }

    const deletePageMatch = pathname.match(/^\/tasks\/([^/]+)\/delete$/);
    if (request.method === "POST" && deletePageMatch) {
      try {
        await taskService.deleteTask(deletePageMatch[1]);
        return redirect(TASK_EDIT_ROUTE);
      } catch (error) {
        return taskErrorResponse(error);
      }
    }

    if (request.method === "GET" && pathname === "/api/tasks") {
      const tasks = await taskService.listTasks();
      return jsonResponse({ tasks });
    }

    if (request.method === "GET" && pathname === TASK_EVENTS_ROUTE) {
      return sse(request);
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

    const cyclePriorityApiMatch = pathname.match(
      /^\/api\/tasks\/([^/]+)\/cycle-priority$/,
    );
    if (request.method === "POST" && cyclePriorityApiMatch) {
      try {
        const task = await taskService.cycleTaskPriority(
          cyclePriorityApiMatch[1],
        );
        return jsonResponse({ task });
      } catch (error) {
        return taskJsonErrorResponse(error);
      }
    }

    const updateApiMatch = pathname.match(/^\/api\/tasks\/([^/]+)$/);
    if (request.method === "PATCH" && updateApiMatch) {
      try {
        const body = await request.json() as {
          title?: string;
          priority?: string;
        };

        const task = await taskService.updateTask({
          id: updateApiMatch[1],
          title: body.title,
          priority: body.priority as TaskPriority | undefined,
        });

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

function renderDocument(
  tasks: TaskData[],
  options: {
    editable: boolean;
    editorEnhancements?: boolean;
    liveUpdates?: boolean;
    variant?: "editor" | "obs";
  },
): string {
  const app = render(
    <TaskApp
      tasks={tasks}
      priorities={TASK_PRIORITIES}
      editable={options.editable}
      variant={options.variant}
    />,
  );

  const bodyBackground = options.variant === "obs"
    ? "transparent"
    : `radial-gradient(circle at top, rgba(95, 193, 255, 0.16), transparent 34%),
          linear-gradient(180deg, #101820 0%, #13232e 100%)`;
  const rootBackground = options.variant === "obs" ? "transparent" : "#101820";

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
        background: ${rootBackground};
        color: #f3f7f0;
      }

      html {
        background: ${rootBackground};
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background: ${bodyBackground};
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
  <body>${app}${renderEditorScript(options.editorEnhancements ?? false)}${
    renderLiveUpdateScript(options.liveUpdates ?? false)
  }</body>
</html>`;
}

function renderEditorScript(enabled: boolean): string {
  if (!enabled) {
    return "";
  }

  return `
    <script>
      document.addEventListener("click", async (event) => {
        const priorityButton = event.target.closest("[data-priority-button]");
        if (priorityButton instanceof HTMLElement) {
          const id = priorityButton.dataset.taskId;
          if (!id) return;

          await fetch("/api/tasks/" + id + "/cycle-priority", { method: "POST" });
          window.location.reload();
          return;
        }

        const titleButton = event.target.closest("[data-title-button]");
        if (!(titleButton instanceof HTMLElement)) return;
        if (document.querySelector("[data-inline-editor]")) return;

        const id = titleButton.dataset.taskId;
        const originalTitle = titleButton.dataset.taskTitle ?? titleButton.textContent ?? "";
        if (!id) return;

        const input = document.createElement("input");
        input.type = "text";
        input.value = originalTitle;
        input.setAttribute("data-inline-editor", "true");
        input.style.width = Math.max(titleButton.getBoundingClientRect().width + 24, 180) + "px";
        input.style.padding = "4px 8px";
        input.style.borderRadius = "8px";
        input.style.border = "1px solid rgba(255, 255, 255, 0.18)";
        input.style.background = "rgba(255, 255, 255, 0.08)";
        input.style.color = "inherit";
        input.style.font = "inherit";

        titleButton.hidden = true;
        titleButton.insertAdjacentElement("afterend", input);
        input.focus();
        input.select();

        let handled = false;

        const finish = async (commit) => {
          if (handled) return;
          handled = true;

          const nextTitle = input.value.trim();
          input.remove();
          titleButton.hidden = false;

          if (!commit || nextTitle === originalTitle || !nextTitle) {
            return;
          }

          await fetch("/api/tasks/" + id, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ title: nextTitle }),
          });

          window.location.reload();
        };

        input.addEventListener("keydown", (keyboardEvent) => {
          if (keyboardEvent.key === "Enter") {
            keyboardEvent.preventDefault();
            finish(true);
          }

          if (keyboardEvent.key === "Escape") {
            keyboardEvent.preventDefault();
            finish(false);
          }
        });

        input.addEventListener("blur", () => finish(true), { once: true });
      });
    </script>
  `;
}

function renderLiveUpdateScript(liveUpdates: boolean): string {
  if (!liveUpdates) {
    return "";
  }

  return `
    <script>
      const source = new EventSource("${TASK_EVENTS_ROUTE}");
      source.addEventListener("tasks", () => {
        window.location.reload();
      });
      source.addEventListener("error", () => {
        source.close();
        window.setTimeout(() => {
          window.location.reload();
        }, 1000);
      });
    </script>
  `;
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

function createTaskEventStream(taskService: TaskService) {
  const encoder = new TextEncoder();
  const clients = new Set<ReadableStreamDefaultController<Uint8Array>>();

  taskService.subscribe((tasks) => {
    const payload = encoder.encode(
      `event: tasks\ndata: ${JSON.stringify({ tasks })}\n\n`,
    );
    for (const client of clients) {
      client.enqueue(payload);
    }
  });

  return (request: Request): Response => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        clients.add(controller);
        controller.enqueue(encoder.encode(": connected\n\n"));

        request.signal.addEventListener("abort", () => {
          clients.delete(controller);
          controller.close();
        }, { once: true });
      },
      cancel() {
        // Deno will call cancel when the client disconnects normally.
      },
    });

    return new Response(stream, {
      headers: {
        "cache-control": "no-cache",
        "connection": "keep-alive",
        "content-type": "text/event-stream",
      },
    });
  };
}
