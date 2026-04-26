import { DomainEvent } from '../domain/domain-event.js';

export interface DomainEventPublisher {
  publish(events: ReadonlyArray<DomainEvent>): Promise<void>;
}

export interface DomainEventHandler<TEvent extends DomainEvent = DomainEvent> {
  handle(event: TEvent): Promise<void>;
}
