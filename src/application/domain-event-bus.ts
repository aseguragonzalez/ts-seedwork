import type { DomainEvent } from '../domain/domain-event.js';

export interface DomainEventHandler<TEvent extends DomainEvent = DomainEvent> {
  handle(event: TEvent): Promise<void>;
}

export interface DomainEventBusPublisher {
  publish(events: ReadonlyArray<DomainEvent>): Promise<void>;
}

export interface DomainEventBusSubscriber {
  subscribe<TEvent extends DomainEvent>(
    eventType: Function & { prototype: TEvent },
    handler: DomainEventHandler<TEvent>
  ): void;
}

export interface DomainEventBus extends DomainEventBusPublisher, DomainEventBusSubscriber {
  dispatch(): Promise<void>;
  discard(): void;
}
