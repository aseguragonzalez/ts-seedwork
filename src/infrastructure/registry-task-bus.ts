import type { BackgroundTask, TaskBus, TaskHandler } from '../application/background-task.js';

export class RegistryTaskBus implements TaskBus {
  private readonly handlers = new Map<string, TaskHandler>();

  register(taskType: string, handler: TaskHandler): void {
    this.handlers.set(taskType, handler);
  }

  async dispatch(task: BackgroundTask): Promise<void> {
    const handler = this.handlers.get(task.type);
    if (!handler) {
      throw new Error(`No handler registered for task type: ${task.type}`);
    }
    await handler.handle(task);
  }
}
