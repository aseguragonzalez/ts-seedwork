import type { IntegrationEvent, IntegrationEventPublisher } from '../application/integration-event.js';

export class InMemoryIntegrationEventPublisher implements IntegrationEventPublisher {
  private readonly _published: IntegrationEvent[] = [];

  get published(): ReadonlyArray<IntegrationEvent> {
    return this._published;
  }

  async publish(events: ReadonlyArray<IntegrationEvent>): Promise<void> {
    this._published.push(...events);
  }

  clear(): void {
    this._published.length = 0;
  }
}
