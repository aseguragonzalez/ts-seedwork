import type { IntegrationEvent } from './integration-event.js';

export type OutboxStatus = 'pending' | 'published' | 'failed';

export interface OutboxRecord {
  readonly id: string;
  readonly event: IntegrationEvent;
  readonly status: OutboxStatus;
  readonly attempts: number;
  readonly lastError?: string;
  readonly createdAt: Date;
  readonly publishedAt?: Date;
}

export interface OutboxRepository {
  save(event: IntegrationEvent): Promise<void>;
  findPending(limit?: number): Promise<ReadonlyArray<OutboxRecord>>;
  markAsPublished(id: string): Promise<void>;
  markAsFailed(id: string, error: string): Promise<void>;
}
