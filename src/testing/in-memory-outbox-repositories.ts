import type { BackgroundTask } from '../application/background-task.js';
import type { IntegrationEvent } from '../application/integration-event.js';
import type {
  IntegrationEventOutboxRecord,
  IntegrationEventOutboxRepository,
  TaskOutboxRecord,
  TaskOutboxRepository,
  TaskOutboxStatus,
} from '../infrastructure/outbox.js';

export interface IntegrationEventOutboxRepositorySpy extends IntegrationEventOutboxRepository {
  readonly all: ReadonlyArray<IntegrationEventOutboxRecord>;
  reset(): void;
}

export class InMemoryIntegrationEventOutboxRepository implements IntegrationEventOutboxRepositorySpy {
  private readonly records = new Map<string, IntegrationEventOutboxRecord>();

  get all(): ReadonlyArray<IntegrationEventOutboxRecord> {
    return [...this.records.values()];
  }

  async save(event: IntegrationEvent): Promise<void> {
    const record: IntegrationEventOutboxRecord = {
      id: crypto.randomUUID(),
      event,
      status: 'pending',
      attempts: 0,
      createdAt: new Date(),
    };
    this.records.set(record.id, record);
  }

  async findPending(limit = 100): Promise<ReadonlyArray<IntegrationEventOutboxRecord>> {
    return [...this.records.values()].filter(r => r.status === 'pending').slice(0, limit);
  }

  async markAsPublished(id: string): Promise<void> {
    const r = this.records.get(id);
    if (r) {
      this.records.set(id, { ...r, status: 'published', publishedAt: new Date() });
    }
  }

  async markAsFailed(id: string, error: string): Promise<void> {
    const r = this.records.get(id);
    if (r) {
      this.records.set(id, { ...r, status: 'failed', attempts: r.attempts + 1, lastError: error });
    }
  }

  reset(): void {
    this.records.clear();
  }
}

export interface TaskOutboxRepositorySpy extends TaskOutboxRepository {
  readonly all: ReadonlyArray<TaskOutboxRecord>;
  reset(): void;
}

export class InMemoryTaskOutboxRepository implements TaskOutboxRepositorySpy {
  private readonly records = new Map<string, TaskOutboxRecord>();

  get all(): ReadonlyArray<TaskOutboxRecord> {
    return [...this.records.values()];
  }

  async save(task: BackgroundTask): Promise<void> {
    const record: TaskOutboxRecord = {
      id: crypto.randomUUID(),
      task,
      status: 'pending' as TaskOutboxStatus,
      attempts: 0,
      createdAt: new Date(),
    };
    this.records.set(record.id, record);
  }

  async findPending(limit = 100): Promise<ReadonlyArray<TaskOutboxRecord>> {
    return [...this.records.values()].filter(r => r.status === 'pending').slice(0, limit);
  }

  async markAsDelivered(id: string): Promise<void> {
    const r = this.records.get(id);
    if (r) {
      this.records.set(id, { ...r, status: 'delivered' as TaskOutboxStatus, deliveredAt: new Date() });
    }
  }

  async markAsFailed(id: string, error: string): Promise<void> {
    const r = this.records.get(id);
    if (r) {
      this.records.set(id, { ...r, status: 'failed' as TaskOutboxStatus, attempts: r.attempts + 1, lastError: error });
    }
  }

  reset(): void {
    this.records.clear();
  }
}
