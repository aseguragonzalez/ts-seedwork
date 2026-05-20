export interface IntegrationEvent {
  readonly id: string;
  readonly type: string;
  readonly version: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload: Record<string, unknown>;
  readonly correlationId: string;
  readonly causationId?: string;
  readonly metadata?: Record<string, string>;
}

export abstract class BaseIntegrationEvent implements IntegrationEvent {
  readonly id: string;
  readonly occurredAt: Date;

  protected constructor(
    public readonly type: string,
    public readonly version: string,
    public readonly aggregateId: string,
    public readonly payload: Record<string, unknown>,
    public readonly correlationId: string,
    public readonly causationId?: string,
    public readonly metadata?: Record<string, string>,
    id?: string,
    occurredAt?: Date
  ) {
    this.id = id ?? crypto.randomUUID();
    this.occurredAt = occurredAt ?? new Date();
  }
}

export interface IntegrationEventPublisher {
  publish(events: ReadonlyArray<IntegrationEvent>): Promise<void>;
}

export interface IntegrationEventHandler<TEvent extends IntegrationEvent = IntegrationEvent> {
  handle(event: TEvent): Promise<void>;
}
