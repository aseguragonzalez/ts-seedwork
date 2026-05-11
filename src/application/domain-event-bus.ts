import type { DomainEvent } from '../domain/domain-event.js';
import type { DomainEventHandler } from './domain-events.js';

export interface DomainEventBusPublisher {
  publish(events: ReadonlyArray<DomainEvent>): Promise<void>;
}

export interface DomainEventBusSubscriber {
  subscribe<TEvent extends DomainEvent>(
    eventType: new (...args: any[]) => TEvent,
    handler: DomainEventHandler<TEvent>
  ): void;
}

export interface DomainEventBus extends DomainEventBusPublisher, DomainEventBusSubscriber {
  dispatch(): Promise<void>;
  discard(): void;
}
