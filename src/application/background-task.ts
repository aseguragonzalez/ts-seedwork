export interface BackgroundTask {
  readonly id: string;
  readonly type: string;
  readonly payload: Record<string, unknown>;
  readonly correlationId: string;
  readonly causationId?: string;
}

export abstract class BaseBackgroundTask implements BackgroundTask {
  readonly id: string;
  protected constructor(
    public readonly type: string,
    public readonly payload: Record<string, unknown>,
    public readonly correlationId: string,
    public readonly causationId?: string,
    id?: string
  ) {
    this.id = id ?? crypto.randomUUID();
  }
}

export interface TaskScheduler {
  schedule(task: BackgroundTask): Promise<void>;
}

export interface TaskHandler<T extends BackgroundTask = BackgroundTask> {
  handle(task: T): Promise<void>;
}
