import type { DomainEventBus, DomainEventHandler } from '../application/domain-event-bus.js';
import type { DomainEvent } from '../domain/domain-event.js';

export interface DomainEventBusSpy extends DomainEventBus {
  readonly pending: ReadonlyArray<DomainEvent>;
  reset(): void;
}

export class DeferredDomainEventBus implements DomainEventBus {
  protected readonly handlers = new Map<Function, DomainEventHandler<any>[]>();
  protected readonly buffer = new Map<string, DomainEvent>();

  subscribe<TEvent extends DomainEvent>(
    eventType: Function & { prototype: TEvent },
    handler: DomainEventHandler<TEvent>
  ): void {
    const existing = this.handlers.get(eventType) ?? [];
    this.handlers.set(eventType, [...existing, handler]);
  }

  async publish(events: ReadonlyArray<DomainEvent>): Promise<void> {
    for (const event of events) {
      if (!this.buffer.has(event.id)) {
        this.buffer.set(event.id, event);
      }
    }
  }

  async dispatch(): Promise<void> {
    const events = [...this.buffer.values()];
    this.buffer.clear();
    for (const event of events) {
      const handlers = this.handlers.get(event.constructor) ?? [];
      for (const handler of handlers) {
        await handler.handle(event);
      }
    }
  }

  discard(): void {
    this.buffer.clear();
  }
}

export class DeferredDomainEventBusSpy extends DeferredDomainEventBus implements DomainEventBusSpy {
  get pending(): ReadonlyArray<DomainEvent> {
    return [...this.buffer.values()];
  }

  reset(): void {
    this.buffer.clear();
    this.handlers.clear();
  }
}
