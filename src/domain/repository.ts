import { AggregateRoot } from './aggregate-root.js';

export interface Repository<TId, TAggregate extends AggregateRoot<TId>> {
  getById(id: TId): Promise<TAggregate | null>;
  save(entity: TAggregate): Promise<void>;
  delete(id: TId): Promise<void>;
}
