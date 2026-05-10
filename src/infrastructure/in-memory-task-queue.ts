import type { BackgroundTask, TaskQueue } from '../application/background-task.js';

export class InMemoryTaskQueue implements TaskQueue {
  private readonly store = new Map<string, BackgroundTask>();
  private readonly queue: string[] = [];

  async enqueue(task: BackgroundTask): Promise<void> {
    this.store.set(task.id, task);
    this.queue.push(task.id);
  }

  async dequeue(): Promise<BackgroundTask | null> {
    const id = this.queue.find(id => this.store.get(id)?.status === 'pending');
    if (!id) return null;
    this.queue.splice(this.queue.indexOf(id), 1);
    const task = this.store.get(id)!;
    const running = { ...task, status: 'running' as const, startedAt: new Date() };
    this.store.set(id, running);
    return running;
  }

  async ack(taskId: string): Promise<void> {
    const task = this.store.get(taskId);
    if (task) {
      this.store.set(taskId, { ...task, status: 'completed' as const, completedAt: new Date() });
    }
  }

  async nack(taskId: string, error: string): Promise<void> {
    const task = this.store.get(taskId);
    if (!task) return;
    const updated = { ...task, attempts: task.attempts + 1, lastError: error };
    if (updated.attempts >= updated.maxAttempts) {
      this.store.set(taskId, { ...updated, status: 'failed' as const });
    } else {
      this.store.set(taskId, { ...updated, status: 'pending' as const });
      this.queue.push(taskId);
    }
  }

  async findById(taskId: string): Promise<BackgroundTask | null> {
    return this.store.get(taskId) ?? null;
  }
}
