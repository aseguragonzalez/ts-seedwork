import type { DomainEvent } from '../domain/domain-event.js';

export interface DomainEventBusContext {
  current(): Map<string, DomainEvent>;
}
