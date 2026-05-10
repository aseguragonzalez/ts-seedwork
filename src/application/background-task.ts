export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface BackgroundTask {
  readonly id: string;
  readonly type: string;
  readonly payload: Record<string, unknown>;
  readonly status: TaskStatus;
  readonly scheduledAt: Date;
  readonly startedAt?: Date;
  readonly completedAt?: Date;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly lastError?: string;
  readonly correlationId: string;
  readonly causationId?: string;
}

export interface TaskQueue {
  enqueue(task: BackgroundTask): Promise<void>;
  dequeue(): Promise<BackgroundTask | null>;
  ack(taskId: string): Promise<void>;
  nack(taskId: string, error: string): Promise<void>;
  findById(taskId: string): Promise<BackgroundTask | null>;
}

export interface TaskHandler<T extends BackgroundTask = BackgroundTask> {
  handle(task: T): Promise<void>;
}

export interface TaskBus {
  dispatch(task: BackgroundTask): Promise<void>;
  register(taskType: string, handler: TaskHandler): void;
}
