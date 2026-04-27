import { AggregateRoot } from './aggregate-root.js';

export interface Repository<TId, TAggregate extends AggregateRoot<TId>> {
  findById(id: TId): Promise<TAggregate | null>;
  save(entity: TAggregate): Promise<void>;
  deleteById(id: TId): Promise<void>;
}
