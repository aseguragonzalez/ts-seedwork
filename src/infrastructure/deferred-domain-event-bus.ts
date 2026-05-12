import type { DomainEventBus, DomainEventHandler } from '../application/domain-event-bus.js';
import type { DomainEvent } from '../domain/domain-event.js';

export class DeferredDomainEventBus implements DomainEventBus {
  private readonly handlers = new Map<Function, DomainEventHandler<any>[]>();
  private readonly pending = new Map<string, DomainEvent>();

  subscribe<TEvent extends DomainEvent>(
    eventType: Function & { prototype: TEvent },
    handler: DomainEventHandler<TEvent>
  ): void {
    const existing = this.handlers.get(eventType) ?? [];
    this.handlers.set(eventType, [...existing, handler]);
  }

  async publish(events: ReadonlyArray<DomainEvent>): Promise<void> {
    for (const event of events) {
      if (!this.pending.has(event.id)) {
        this.pending.set(event.id, event);
      }
    }
  }

  async dispatch(): Promise<void> {
    const events = [...this.pending.values()];
    this.pending.clear();
    for (const event of events) {
      const handlers = this.handlers.get(event.constructor) ?? [];
      for (const handler of handlers) {
        await handler.handle(event);
      }
    }
  }

  discard(): void {
    this.pending.clear();
  }
}
