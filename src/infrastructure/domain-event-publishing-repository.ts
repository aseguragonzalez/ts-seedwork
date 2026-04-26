import type { DomainEventPublisher } from '../application/domain-events.js';
import type { AggregateRoot } from '../domain/aggregate-root.js';
import type { Repository } from '../domain/repository.js';

export class DomainEventPublishingRepository<TId, TAggregate extends AggregateRoot<TId>>
  implements Repository<TId, TAggregate>
{
  constructor(
    private readonly inner: Repository<TId, TAggregate>,
    private readonly publisher: DomainEventPublisher
  ) {}

  async getById(id: TId): Promise<TAggregate | null> {
    return this.inner.getById(id);
  }

  async save(entity: TAggregate): Promise<void> {
    await this.inner.save(entity);
    await this.publisher.publish(entity.getDomainEvents());
  }

  async delete(id: TId): Promise<void> {
    await this.inner.delete(id);
  }
}
