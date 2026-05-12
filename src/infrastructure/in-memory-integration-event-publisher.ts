import type { IntegrationEvent, IntegrationEventPublisherSpy } from '../application/integration-event.js';

export class InMemoryIntegrationEventPublisher implements IntegrationEventPublisherSpy {
  private readonly events: IntegrationEvent[] = [];

  get published(): ReadonlyArray<IntegrationEvent> {
    return [...this.events];
  }

  async publish(incoming: ReadonlyArray<IntegrationEvent>): Promise<void> {
    this.events.push(...incoming);
  }

  reset(): void {
    this.events.length = 0;
  }
}
