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

export class OutboxIntegrationEventPublisher implements IntegrationEventPublisher {
  constructor(private readonly repository: IntegrationEventOutboxRepository) {}

  async publish(events: ReadonlyArray<IntegrationEvent>): Promise<void> {
    for (const event of events) {
      await this.repository.save(event);
    }
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

export class OutboxTaskScheduler implements TaskScheduler {
  constructor(private readonly repository: TaskOutboxRepository) {}

  async schedule(task: BackgroundTask): Promise<void> {
    await this.repository.save(task);
  }
}
