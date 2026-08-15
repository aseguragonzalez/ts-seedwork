import type { DomainEventBus } from '../application/domain-event-bus.js';
import type { DomainEvent } from '../domain/domain-event.js';
import { DeferredDomainEventBus } from '../infrastructure/deferred-domain-event-bus.js';

export interface DomainEventBusSpy extends DomainEventBus {
  readonly pending: ReadonlyArray<DomainEvent>;
  reset(): void;
}

export class DeferredDomainEventBusSpy extends DeferredDomainEventBus implements DomainEventBusSpy {
  get pending(): ReadonlyArray<DomainEvent> {
    return [...this.context.current().values()];
  }

  reset(): void {
    this.context.current().clear();
    this.handlers.clear();
  }
}
