import { DomainEvent } from './domain-event.js';
import { Entity } from './entity.js';

export abstract class AggregateRoot<TId> extends Entity<TId> {
  protected constructor(
    id: TId,
    private readonly domainEvents: ReadonlyArray<DomainEvent> = []
  ) {
    super(id);
  }

  public getDomainEvents(): ReadonlyArray<DomainEvent> {
    return [...this.domainEvents];
  }
}
