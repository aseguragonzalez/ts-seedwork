export interface DomainEvent {
  id: string;
  eventName: string;
  payload: Record<string, any>;
  occurredAt: Date;
  version: string;
}

export abstract class BaseDomainEvent implements DomainEvent {
  protected constructor(
    public readonly id: string,
    public readonly eventName: string,
    public readonly payload: Record<string, any>,
    public readonly occurredAt: Date,
    public readonly version: string
  ) {}
}
