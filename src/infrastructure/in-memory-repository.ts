import type { AggregateRoot } from '../domain/aggregate-root.js';
import type { Repository } from '../domain/repository.js';

export class InMemoryRepository<
  TId extends { toString(): string },
  TAggregate extends AggregateRoot<TId>,
> implements Repository<TId, TAggregate> {
  protected readonly store = new Map<string, TAggregate>();

  protected keyOf(id: TId): string {
    return id.toString();
  }

  async findById(id: TId): Promise<TAggregate | null> {
    return this.store.get(this.keyOf(id)) ?? null;
  }

  async save(aggregate: TAggregate): Promise<void> {
    this.store.set(this.keyOf(aggregate.id), aggregate);
  }

  async deleteById(id: TId): Promise<void> {
    this.store.delete(this.keyOf(id));
  }
}
