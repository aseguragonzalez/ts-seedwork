import type { IntegrationEvent, IntegrationEventPublisher } from '../application/integration-event.js';
import type { OutboxRepository } from '../application/outbox.js';

export class OutboxIntegrationEventPublisher implements IntegrationEventPublisher {
  constructor(private readonly repository: OutboxRepository) {}

  async publish(events: ReadonlyArray<IntegrationEvent>): Promise<void> {
    for (const event of events) {
      await this.repository.save(event);
    }
  }
}
