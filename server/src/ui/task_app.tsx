import type { JSX } from "preact";
import type { TaskData, TaskPriority } from "../features/tasks/task_types.ts";

type TaskAppProps = {
  tasks: TaskData[];
  priorities: readonly TaskPriority[];
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function TaskApp(props: TaskAppProps) {
  return (
    <main style={styles.shell}>
      <section style={styles.card}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>Local OBS Todo</p>
            <h1 style={styles.title}>On-screen task list</h1>
          </div>
          <p style={styles.summary}>
            {props.tasks.length} task{props.tasks.length === 1 ? "" : "s"}
          </p>
        </header>

        <form method="POST" action="/tasks" style={styles.addForm}>
          <input
            type="text"
            name="title"
            placeholder="Add a task..."
            required
            style={styles.input}
          />
          <select name="priority" defaultValue="medium" style={styles.select}>
            {props.priorities.map((priority) => (
              <option value={priority}>{PRIORITY_LABELS[priority]}</option>
            ))}
          </select>
          <button type="submit" style={styles.primaryButton}>Add</button>
        </form>

        <section style={styles.list}>
          {props.tasks.length === 0
            ? (
              <div style={styles.emptyState}>
                <p style={styles.emptyTitle}>No tasks yet</p>
                <p style={styles.emptyCopy}>
                  Create the first item and it will be saved locally to JSON.
                </p>
              </div>
            )
            : (
              props.tasks.map((task) => (
                <article style={styles.taskRow} key={task.id}>
                  <form method="POST" action={`/tasks/${task.id}/toggle`}>
                    <button type="submit" style={checkboxStyle(task.isChecked)}>
                      {task.isChecked ? "Done" : "Open"}
                    </button>
                  </form>

                  <div style={styles.taskBody}>
                    <strong style={taskTitleStyle(task.isChecked)}>
                      {task.title}
                    </strong>
                    <span style={priorityBadgeStyle(task.priority)}>
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                  </div>

                  <form method="POST" action={`/tasks/${task.id}/delete`}>
                    <button type="submit" style={styles.deleteButton}>
                      Delete
                    </button>
                  </form>
                </article>
              ))
            )}
        </section>
      </section>
    </main>
  );
}

const styles: Record<string, JSX.CSSProperties> = {
  shell: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  card: {
    width: "min(760px, 100%)",
    background: "rgba(11, 20, 27, 0.88)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.34)",
    backdropFilter: "blur(16px)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "end",
    marginBottom: "20px",
  },
  eyebrow: {
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: "12px",
    color: "#8ecae6",
  },
  title: {
    margin: "6px 0 0",
    fontSize: "clamp(28px, 4vw, 42px)",
    lineHeight: 1,
  },
  summary: {
    margin: 0,
    color: "#b7c5d3",
  },
  addForm: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 140px 110px",
    gap: "12px",
    marginBottom: "18px",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    background: "rgba(255, 255, 255, 0.06)",
    color: "inherit",
  },
  select: {
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    background: "rgba(255, 255, 255, 0.06)",
    color: "inherit",
  },
  primaryButton: {
    border: "none",
    borderRadius: "14px",
    background: "#8ecae6",
    color: "#0b141b",
    fontWeight: 700,
  },
  list: {
    display: "grid",
    gap: "10px",
  },
  emptyState: {
    padding: "24px",
    borderRadius: "18px",
    border: "1px dashed rgba(255, 255, 255, 0.14)",
    color: "#c3d0dc",
  },
  emptyTitle: {
    margin: "0 0 6px",
    fontWeight: 700,
  },
  emptyCopy: {
    margin: 0,
  },
  taskRow: {
    display: "grid",
    gridTemplateColumns: "86px minmax(0, 1fr) 88px",
    gap: "12px",
    alignItems: "center",
    padding: "14px",
    borderRadius: "18px",
    background: "rgba(255, 255, 255, 0.05)",
  },
  taskBody: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "10px",
  },
  deleteButton: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    background: "transparent",
    color: "#ff9c9c",
  },
};

function checkboxStyle(isChecked: boolean): JSX.CSSProperties {
  return {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "12px",
    border: "none",
    background: isChecked ? "#3ddc97" : "#ffd166",
    color: "#0b141b",
    fontWeight: 700,
  };
}

function taskTitleStyle(isChecked: boolean): JSX.CSSProperties {
  return {
    fontSize: "18px",
    textDecoration: isChecked ? "line-through" : "none",
    opacity: isChecked ? 0.65 : 1,
  };
}

function priorityBadgeStyle(priority: TaskPriority): JSX.CSSProperties {
  const background = {
    high: "#ef476f",
    medium: "#ffd166",
    low: "#06d6a0",
  }[priority];

  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: "999px",
    background,
    color: "#0b141b",
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "uppercase",
  };
}
