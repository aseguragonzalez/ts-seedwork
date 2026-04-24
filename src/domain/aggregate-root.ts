import { DomainEvent } from './domain-event.js';
import { Entity } from './entity.js';

export abstract class AggregateRoot<ID> extends Entity<ID> {
  protected constructor(
    id: ID,
    private readonly domainEvents: ReadonlyArray<DomainEvent> = []
  ) {
    super(id);
  }

  protected withEvent(event: DomainEvent): this {
    const clone = Object.assign(Object.create(Object.getPrototypeOf(this)) as this, this);

    (clone as any).domainEvents = [...this.domainEvents, event];
    return clone;
  }

  public getDomainEvents(): ReadonlyArray<DomainEvent> {
    return [...this.domainEvents];
  }
}
