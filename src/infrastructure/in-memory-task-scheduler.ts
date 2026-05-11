import type { BackgroundTask, TaskHandler, TaskScheduler } from '../application/background-task.js';

export interface TaskSchedulerSpy extends TaskScheduler {
  readonly scheduled: ReadonlyArray<BackgroundTask>;
  register(taskType: string, handler: TaskHandler): void;
  executeScheduled(): Promise<void>;
  reset(): void;
}

export class InMemoryTaskScheduler implements TaskSchedulerSpy {
  private readonly _scheduled: BackgroundTask[] = [];
  private readonly handlers = new Map<string, TaskHandler>();

  get scheduled(): ReadonlyArray<BackgroundTask> {
    return this._scheduled;
  }

  register(taskType: string, handler: TaskHandler): void {
    this.handlers.set(taskType, handler);
  }

  async schedule(task: BackgroundTask): Promise<void> {
    this._scheduled.push(task);
  }

  async executeScheduled(): Promise<void> {
    for (const task of this._scheduled) {
      const handler = this.handlers.get(task.type);
      if (handler) {
        await handler.handle(task);
      }
    }
  }

  reset(): void {
    this._scheduled.length = 0;
  }
}
