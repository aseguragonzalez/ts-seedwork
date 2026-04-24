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
    let i = 0;
    try {
      for (; i < events.length; i++) {
        const handlers = this.subscriptions.get(events[i].eventName) ?? [];
        await Promise.all(handlers.map(h => h.handle(events[i])));
      }
    } catch (error) {
      this.buffer = [...events.slice(i), ...this.buffer];
      throw error;
    }
  }
}
