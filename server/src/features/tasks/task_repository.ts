import type { TaskData, TaskStore } from "./task_types.ts";

const EMPTY_STORE: TaskStore = { tasks: [] };

export class JsonTaskRepository {
  #fileUrl: URL;
  #writeChain = Promise.resolve();

  constructor(fileUrl: URL) {
    this.#fileUrl = fileUrl;
  }

  async initialize(): Promise<TaskData[]> {
    const store = await this.#readStore();
    return [...store.tasks];
  }

  async list(): Promise<TaskData[]> {
    const store = await this.#readStore();
    return [...store.tasks];
  }

  async saveAll(tasks: TaskData[]): Promise<void> {
    await this.#enqueueWrite(async () => {
      await this.#writeStore({ tasks });
    });
  }

  async #readStore(): Promise<TaskStore> {
    await this.#ensureFile();

    const raw = await Deno.readTextFile(this.#fileUrl);
    if (!raw.trim()) {
      return EMPTY_STORE;
    }

    const parsed = JSON.parse(raw) as Partial<TaskStore>;
    if (!Array.isArray(parsed.tasks)) {
      return EMPTY_STORE;
    }

    return {
      tasks: parsed.tasks.filter((task): task is TaskData => {
        return typeof task?.id === "string" && typeof task.title === "string";
      }),
    };
  }

  async #writeStore(store: TaskStore): Promise<void> {
    await this.#ensureFile();
    await Deno.writeTextFile(
      this.#fileUrl,
      JSON.stringify(store, null, 2) + "\n",
    );
  }

  async #ensureFile(): Promise<void> {
    const directoryUrl = new URL(".", this.#fileUrl);
    await Deno.mkdir(directoryUrl, { recursive: true });

    try {
      await Deno.stat(this.#fileUrl);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        await Deno.writeTextFile(
          this.#fileUrl,
          JSON.stringify(EMPTY_STORE, null, 2) + "\n",
        );
        return;
      }

      throw error;
    }
  }

  async #enqueueWrite(operation: () => Promise<void>): Promise<void> {
    this.#writeChain = this.#writeChain.then(operation, operation);
    await this.#writeChain;
  }
}
