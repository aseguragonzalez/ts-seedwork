import type { DomainEventBus } from '../application/domain-event-bus.js';
import type { DomainEventHandler } from '../application/domain-events.js';
import type { DomainEvent, TypedDomainEvent } from '../domain/domain-event.js';

export class DeferredDomainEventBus implements DomainEventBus {
  private readonly handlers = new Map<Function, DomainEventHandler<any>[]>();
  private pending: TypedDomainEvent<Record<string, unknown>>[] = [];

  subscribe<TEvent extends DomainEvent>(
    eventType: new (...args: any[]) => TEvent,
    handler: DomainEventHandler<TEvent>
  ): void {
    const existing = this.handlers.get(eventType) ?? [];
    this.handlers.set(eventType, [...existing, handler]);
  }

  async publish(events: ReadonlyArray<TypedDomainEvent<Record<string, unknown>>>): Promise<void> {
    this.pending = [...this.pending, ...events];
  }

  async flush(): Promise<void> {
    const events = this.pending;
    this.pending = [];
    for (const event of events) {
      const handlers = this.handlers.get(event.constructor) ?? [];
      for (const handler of handlers) {
        await handler.handle(event);
      }
    }
  }

  clear(): void {
    this.pending = [];
  }
}
