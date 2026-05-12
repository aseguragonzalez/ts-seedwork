import type { DomainEventBusPublisher } from '../application/domain-event-bus.js';
import type { AggregateRoot } from '../domain/aggregate-root.js';
import type { Repository } from '../domain/repository.js';

export class DomainEventPublishingRepository<TId, TAggregate extends AggregateRoot<TId>> implements Repository<
  TId,
  TAggregate
> {
  constructor(
    private readonly inner: Repository<TId, TAggregate>,
    private readonly eventBus: DomainEventBusPublisher
  ) {}

  async findById(id: TId): Promise<TAggregate | null> {
    return this.inner.findById(id);
  }

  async save(entity: TAggregate): Promise<void> {
    await this.inner.save(entity);
    await this.eventBus.publish(entity.getDomainEvents());
  }

  async deleteById(id: TId): Promise<void> {
    await this.inner.deleteById(id);
  }
}
