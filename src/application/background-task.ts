export interface BackgroundTask<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  readonly id: string;
  readonly type: string;
  readonly payload: TPayload;
  readonly correlationId: string;
  readonly causationId?: string;
  readonly metadata?: Record<string, string>;
}

export abstract class BaseBackgroundTask<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> implements BackgroundTask<TPayload> {
  readonly id: string;
  protected constructor(
    public readonly type: string,
    public readonly payload: TPayload,
    public readonly correlationId: string,
    public readonly causationId?: string,
    public readonly metadata?: Record<string, string>,
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
