import type { DomainEventBus, DomainEventHandler } from '../application/domain-event-bus.js';
import type { DomainEventBusContext } from '../application/domain-event-bus-context.js';
import type { DomainEvent } from '../domain/domain-event.js';

class SingleBufferDomainEventBusContext implements DomainEventBusContext {
  private readonly buffer = new Map<string, DomainEvent>();

  current(): Map<string, DomainEvent> {
    return this.buffer;
  }
}

export class DeferredDomainEventBus implements DomainEventBus {
  protected readonly handlers = new Map<Function, DomainEventHandler<any>[]>();

  constructor(protected readonly context: DomainEventBusContext = new SingleBufferDomainEventBusContext()) {}

  subscribe<TEvent extends DomainEvent>(
    eventType: Function & { prototype: TEvent },
    handler: DomainEventHandler<TEvent>
  ): void {
    const existing = this.handlers.get(eventType) ?? [];
    this.handlers.set(eventType, [...existing, handler]);
  }

  async publish(events: ReadonlyArray<DomainEvent>): Promise<void> {
    const buffer = this.context.current();
    for (const event of events) {
      if (!buffer.has(event.id)) {
        buffer.set(event.id, event);
      }
    }
  }

  async dispatch(): Promise<void> {
    const buffer = this.context.current();
    const events = [...buffer.values()];
    buffer.clear();
    for (const event of events) {
      const handlers = this.handlers.get(event.constructor) ?? [];
      for (const handler of handlers) {
        await handler.handle(event);
      }
    }
  }

  discard(): void {
    this.context.current().clear();
  }
}
