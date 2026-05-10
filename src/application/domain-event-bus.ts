import type { DomainEvent } from '../domain/domain-event.js';
import type { DomainEventHandler, DomainEventPublisher } from './domain-events.js';

export interface DomainEventBus extends DomainEventPublisher {
  subscribe<TEvent extends DomainEvent>(
    eventType: new (...args: any[]) => TEvent,
    handler: DomainEventHandler<TEvent>
  ): void;
}
