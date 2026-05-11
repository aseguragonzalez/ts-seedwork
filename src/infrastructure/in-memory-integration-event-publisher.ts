import type { IntegrationEvent, IntegrationEventPublisherSpy } from '../application/integration-event.js';

export class InMemoryIntegrationEventPublisher implements IntegrationEventPublisherSpy {
  private readonly _published: IntegrationEvent[] = [];

  get published(): ReadonlyArray<IntegrationEvent> {
    return [...this._published];
  }

  async publish(events: ReadonlyArray<IntegrationEvent>): Promise<void> {
    this._published.push(...events);
  }

  reset(): void {
    this._published.length = 0;
  }
}
