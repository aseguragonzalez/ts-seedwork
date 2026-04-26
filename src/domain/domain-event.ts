export interface DomainEvent {
  readonly id: string;
  readonly occurredAt: Date;
}

export interface TypedDomainEvent<TPayload extends Record<string, unknown>> extends DomainEvent {
  readonly payload: TPayload;
}

export abstract class BaseDomainEvent<TPayload extends Record<string, unknown>> implements TypedDomainEvent<TPayload> {
  protected constructor(
    public readonly id: string,
    public readonly payload: TPayload,
    public readonly occurredAt: Date = new Date()
  ) {}
}
