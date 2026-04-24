import { DomainEventBus, DomainEventHandler } from '../application/domain-events.js';
import { DomainEvent } from '../domain/domain-event.js';

export class DeferredDomainEventBus implements DomainEventBus {
  private buffer: DomainEvent[] = [];
  private readonly subscriptions = new Map<string, DomainEventHandler[]>();

  public subscribe(eventType: string, handlers: DomainEventHandler[]): void {
    const existing = this.subscriptions.get(eventType) ?? [];
    this.subscriptions.set(eventType, [...existing, ...handlers]);
  }

  public async publish(events: DomainEvent[]): Promise<void> {
    this.buffer.push(...events);
  }

  public async flush(): Promise<void> {
    const events = [...this.buffer];
    this.buffer = [];
    for (const event of events) {
      const handlers = this.subscriptions.get(event.eventName) ?? [];
      await Promise.all(handlers.map(h => h.handle(event)));
    }
  }
}
