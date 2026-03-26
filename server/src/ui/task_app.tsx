import type { JSX } from "preact";
import type { TaskData, TaskPriority } from "../features/tasks/task_types.ts";

type TaskAppProps = {
  tasks: TaskData[];
  priorities: readonly TaskPriority[];
  editable?: boolean;
  variant?: "editor" | "obs";
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function TaskApp(props: TaskAppProps) {
  const isEditable = props.editable ?? true;
  const variant = props.variant ?? "editor";
  const isObs = variant === "obs";

  return (
    <main style={shellStyle(isObs)}>
      <section style={cardStyle(isObs)}>
        {isEditable
          ? (
            <form method="POST" action="/tasks" style={styles.addForm}>
              <input
                type="text"
                name="title"
                placeholder="Add a task..."
                required
                style={styles.input}
              />
              <select
                name="priority"
                defaultValue="medium"
                style={styles.select}
              >
                {props.priorities.map((priority) => (
                  <option value={priority}>{PRIORITY_LABELS[priority]}</option>
                ))}
              </select>
              <button type="submit" style={styles.primaryButton}>Add</button>
            </form>
          )
          : null}

        <section style={styles.list}>
          {props.tasks.length === 0
            ? (
              <div style={emptyStateStyle(isObs)}>
                <p style={styles.emptyTitle}>No tasks yet</p>
                <p style={styles.emptyCopy}>
                  Create the first item and it will be saved locally to JSON.
                </p>
              </div>
            )
            : (
              props.tasks.map((task) => (
                <article
                  style={taskRowStyle(isObs, task.isChecked)}
                  key={task.id}
                >
                  {isEditable
                    ? (
                      <form method="POST" action={`/tasks/${task.id}/toggle`}>
                        <button
                          type="submit"
                          style={checkboxStyle(task.isChecked)}
                          aria-label={task.isChecked
                            ? "Mark task as open"
                            : "Mark task as done"}
                        >
                          {task.isChecked ? "\u2713" : ""}
                        </button>
                      </form>
                    )
                    : (
                      <span style={checkboxStyle(task.isChecked)}>
                        {task.isChecked ? "\u2713" : ""}
                      </span>
                    )}

                  <div style={taskBodyStyle(isObs)}>
                    <span style={priorityBadgeStyle(task.priority)}>
                      <PriorityIcon priority={task.priority} />
                    </span>
                    <strong style={taskTitleStyle(task.isChecked, isObs)}>
                      {task.title}
                    </strong>
                  </div>

                  {isEditable
                    ? (
                      task.isChecked
                        ? (
                          <form
                            method="POST"
                            action={`/tasks/${task.id}/delete`}
                          >
                            <button
                              type="submit"
                              style={styles.deleteButton}
                              aria-label="Delete task"
                              title="Delete task"
                            >
                              <TrashIcon />
                            </button>
                          </form>
                        )
                        : <div style={styles.deleteSlot} />
                    )
                    : null}
                </article>
              ))
            )}
        </section>
      </section>
    </main>
  );
}

const styles: Record<string, JSX.CSSProperties> = {
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
    gridTemplateColumns: "minmax(0, 1fr) 120px 88px",
    gap: "8px",
    marginBottom: "12px",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    background: "rgba(255, 255, 255, 0.06)",
    color: "inherit",
  },
  select: {
    padding: "10px 12px",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    background: "rgba(255, 255, 255, 0.06)",
    color: "inherit",
  },
  primaryButton: {
    border: "none",
    borderRadius: "12px",
    background: "#8ecae6",
    color: "#0b141b",
    fontWeight: 700,
    padding: "0 12px",
  },
  list: {
    display: "grid",
    gap: "6px",
  },
  emptyState: {
    padding: "18px",
    borderRadius: "14px",
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
    gridTemplateColumns: "40px minmax(0, 1fr) 56px",
    gap: "6px",
    alignItems: "center",
    padding: "8px 10px",
    borderRadius: "14px",
    background: "rgba(255, 255, 255, 0.05)",
  },
  taskBody: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    minWidth: 0,
  },
  deleteSlot: {
    minHeight: "32px",
  },
  deleteButton: {
    width: "100%",
    minHeight: "32px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    background: "transparent",
    color: "#ff9c9c",
  },
};

function checkboxStyle(isChecked: boolean): JSX.CSSProperties {
  return {
    width: "32px",
    height: "32px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    borderRadius: "10px",
    border: `2px solid ${
      isChecked ? "rgba(255, 255, 255, 0.72)" : "rgba(255, 255, 255, 0.28)"
    }`,
    background: isChecked ? "rgba(255, 255, 255, 0.06)" : "transparent",
    color: isChecked ? "#ffffff" : "transparent",
    fontWeight: 700,
    fontSize: "18px",
  };
}

function taskTitleStyle(
  isChecked: boolean,
  isObs: boolean,
): JSX.CSSProperties {
  return {
    fontSize: isObs ? "24px" : "16px",
    fontWeight: isObs ? 400 : 600,
    textDecoration: isChecked ? "line-through" : "none",
    opacity: isChecked ? (isObs ? 0.42 : 0.65) : 1,
    lineHeight: isObs ? 1 : 1.2,
    letterSpacing: "normal",
    textWrap: "balance",
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
    justifyContent: "center",
    width: "20px",
    height: "20px",
    borderRadius: "999px",
    background,
    color: "#0b141b",
    flexShrink: 0,
  };
}

function shellStyle(isObs: boolean): JSX.CSSProperties {
  return {
    minHeight: "100vh",
    display: "flex",
    alignItems: isObs ? "flex-start" : "center",
    justifyContent: isObs ? "flex-start" : "center",
    padding: isObs ? "20px 24px" : "16px",
    width: "100%",
  };
}

function cardStyle(isObs: boolean): JSX.CSSProperties {
  if (isObs) {
    return {
      width: "min(1280px, 100%)",
      background: "transparent",
      border: "none",
      borderRadius: 0,
      padding: 0,
      boxShadow: "none",
      backdropFilter: "none",
    };
  }

  return {
    width: "min(760px, 100%)",
    background: "rgba(11, 20, 27, 0.88)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "20px",
    padding: "16px",
    boxShadow: "0 18px 40px rgba(0, 0, 0, 0.28)",
    backdropFilter: "blur(16px)",
  };
}

function emptyStateStyle(isObs: boolean): JSX.CSSProperties {
  if (isObs) {
    return {
      padding: "20px 24px",
      borderRadius: "18px",
      background: "rgba(8, 12, 16, 0.58)",
      border: "1px solid rgba(255, 255, 255, 0.12)",
      color: "#e1ebf2",
      width: "min(900px, 100%)",
    };
  }

  return styles.emptyState;
}

function taskRowStyle(
  isObs: boolean,
  isChecked: boolean,
): JSX.CSSProperties {
  if (isObs) {
    return {
      display: "inline-grid",
      gridTemplateColumns: "40px auto",
      gap: "12px",
      alignItems: "center",
      minHeight: "44px",
      padding: "6px 12px",
      borderRadius: "16px",
      width: "fit-content",
      maxWidth: "100%",
      background: "rgba(10, 15, 20, 0.82)",
      border: `1px solid ${
        isChecked ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.14)"
      }`,
    };
  }

  return styles.taskRow;
}

function taskBodyStyle(isObs: boolean): JSX.CSSProperties {
  if (isObs) {
    return {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      minWidth: 0,
      width: "fit-content",
      maxWidth: "100%",
    };
  }

  return styles.taskBody;
}

function PriorityIcon(props: { priority: TaskPriority }) {
  if (props.priority === "medium") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        stroke-width="3.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M6 12h12" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      stroke-width="3.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      {props.priority === "high"
        ? <path d="M6 15l6-6 6 6" />
        : <path d="M6 9l6 6 6-6" />}
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}
