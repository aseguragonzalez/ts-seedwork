import { TypedDomainEvent } from './domain-event.js';
import { Entity } from './entity.js';

export abstract class AggregateRoot<TId> extends Entity<TId> {
  protected constructor(
    id: TId,
    private readonly domainEvents: ReadonlyArray<TypedDomainEvent<Record<string, unknown>>> = []
  ) {
    super(id);
  }

  public getDomainEvents(): ReadonlyArray<TypedDomainEvent<Record<string, unknown>>> {
    return [...this.domainEvents];
  }
}
