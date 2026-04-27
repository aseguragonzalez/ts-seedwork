import { DomainEvent, TypedDomainEvent } from '../domain/domain-event.js';

export interface DomainEventPublisher {
  publish(events: ReadonlyArray<TypedDomainEvent<Record<string, unknown>>>): Promise<void>;
}

export interface DomainEventHandler<TEvent extends DomainEvent = DomainEvent> {
  handle(event: TEvent): Promise<void>;
}
