import type { AggregateRoot } from '../domain/aggregate-root.js';
import type { Repository } from '../domain/repository.js';

export class InMemoryRepository<TId, TAggregate extends AggregateRoot<TId>> implements Repository<TId, TAggregate> {
  protected readonly store = new Map<string, TAggregate>();

  async findById(id: TId): Promise<TAggregate | null> {
    return this.store.get(String(id)) ?? null;
  }

  async save(aggregate: TAggregate): Promise<void> {
    this.store.set(String(aggregate.id), aggregate);
  }

  async deleteById(id: TId): Promise<void> {
    this.store.delete(String(id));
  }
}
