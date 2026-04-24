import { DomainEvent } from '../domain/domain-event.js';

export interface DomainEventHandler<TEvent extends DomainEvent = DomainEvent> {
  handle(event: TEvent): Promise<void>;
}

export interface DomainEventBus {
  publish(events: DomainEvent[]): Promise<void>;
  subscribe(eventType: string, handlers: DomainEventHandler[]): void;
}
