import type { IntegrationEvent } from '../application/integration-event.js';
import type { OutboxRecord, OutboxRepository } from '../application/outbox.js';

export class InMemoryOutboxRepository implements OutboxRepository {
  private readonly records = new Map<string, OutboxRecord>();

  async save(event: IntegrationEvent): Promise<void> {
    const record: OutboxRecord = {
      id: crypto.randomUUID(),
      event,
      status: 'pending',
      attempts: 0,
      createdAt: new Date(),
    };
    this.records.set(record.id, record);
  }

  async findPending(limit = 100): Promise<ReadonlyArray<OutboxRecord>> {
    return [...this.records.values()].filter(r => r.status === 'pending').slice(0, limit);
  }

  async markAsPublished(id: string): Promise<void> {
    const record = this.records.get(id);
    if (record) {
      this.records.set(id, { ...record, status: 'published', publishedAt: new Date() });
    }
  }

  async markAsFailed(id: string, error: string): Promise<void> {
    const record = this.records.get(id);
    if (record) {
      this.records.set(id, {
        ...record,
        status: 'failed',
        attempts: record.attempts + 1,
        lastError: error,
      });
    }
  }
}
