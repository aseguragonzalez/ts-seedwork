import type { DomainEventPublisher } from '../application/domain-events.js';
import type { AggregateRoot } from '../domain/aggregate-root.js';
import type { Repository } from '../domain/repository.js';

export class DomainEventPublishingRepository<ID, T extends AggregateRoot<ID>> implements Repository<ID, T> {
  constructor(
    private readonly inner: Repository<ID, T>,
    private readonly publisher: DomainEventPublisher
  ) {}

  async getById(id: ID): Promise<T | null> {
    return this.inner.getById(id);
  }

  async save(entity: T): Promise<void> {
    await this.inner.save(entity);
    await this.publisher.publish(entity.getDomainEvents());
  }

  async delete(id: ID): Promise<void> {
    await this.inner.delete(id);
  }
}
