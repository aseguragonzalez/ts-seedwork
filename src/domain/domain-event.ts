export interface DomainEvent {
  readonly id: string;
  readonly occurredAt: Date;
}

export interface TypedDomainEvent<TPayload extends Record<string, unknown>> extends DomainEvent {
  readonly payload: TPayload;
}

export abstract class BaseDomainEvent<TPayload extends Record<string, unknown>> implements TypedDomainEvent<TPayload> {
  protected constructor(
    public readonly payload: TPayload,
    public readonly id: string = crypto.randomUUID(),
    public readonly occurredAt: Date = new Date()
  ) {}
}
