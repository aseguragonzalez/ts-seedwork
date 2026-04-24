import { AggregateRoot } from './aggregate-root.js';

export interface Repository<ID, T extends AggregateRoot<ID>> {
  getById(id: ID): Promise<T | null>;
  save(entity: T): Promise<void>;
  delete(id: ID): Promise<void>;
}
