import type { BackgroundTask } from '../application/background-task.js';
import type { TaskScheduler } from '../application/background-task.js';
import type { IntegrationEvent, IntegrationEventPublisher } from '../application/integration-event.js';

// Shared status type
export type OutboxStatus = 'pending' | 'published' | 'failed';

// Task-specific status type
export type TaskOutboxStatus = 'pending' | 'delivered' | 'failed';

// Integration Event Outbox
export interface IntegrationEventOutboxRecord {
  readonly id: string;
  readonly event: IntegrationEvent;
  readonly status: OutboxStatus;
  readonly attempts: number;
  readonly lastError?: string;
  readonly createdAt: Date;
  readonly publishedAt?: Date;
}

export interface IntegrationEventOutboxRepository {
  save(event: IntegrationEvent): Promise<void>;
  findPending(limit?: number): Promise<ReadonlyArray<IntegrationEventOutboxRecord>>;
  markAsPublished(id: string): Promise<void>;
  markAsFailed(id: string, error: string): Promise<void>;
}

export interface IntegrationEventOutboxRepositorySpy extends IntegrationEventOutboxRepository {
  readonly all: ReadonlyArray<IntegrationEventOutboxRecord>;
  reset(): void;
}

export class OutboxIntegrationEventPublisher implements IntegrationEventPublisher {
  constructor(private readonly repository: IntegrationEventOutboxRepository) {}

  async publish(events: ReadonlyArray<IntegrationEvent>): Promise<void> {
    for (const event of events) {
      await this.repository.save(event);
    }
  }
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

// Task Outbox
export interface TaskOutboxRecord {
  readonly id: string;
  readonly task: BackgroundTask;
  readonly status: TaskOutboxStatus;
  readonly attempts: number;
  readonly lastError?: string;
  readonly createdAt: Date;
  readonly deliveredAt?: Date;
}

export interface TaskOutboxRepository {
  save(task: BackgroundTask): Promise<void>;
  findPending(limit?: number): Promise<ReadonlyArray<TaskOutboxRecord>>;
  markAsDelivered(id: string): Promise<void>;
  markAsFailed(id: string, error: string): Promise<void>;
}

export interface TaskOutboxRepositorySpy extends TaskOutboxRepository {
  readonly all: ReadonlyArray<TaskOutboxRecord>;
  reset(): void;
}

export class OutboxTaskScheduler implements TaskScheduler {
  constructor(private readonly repository: TaskOutboxRepository) {}

  async schedule(task: BackgroundTask): Promise<void> {
    await this.repository.save(task);
  }
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
      status: 'pending',
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
      this.records.set(id, { ...r, status: 'delivered', deliveredAt: new Date() });
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
