import type { IntegrationEvent, IntegrationEventPublisher } from '../application/integration-event.js';

export interface IntegrationEventPublisherSpy extends IntegrationEventPublisher {
  readonly published: ReadonlyArray<IntegrationEvent>;
  reset(): void;
}

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
