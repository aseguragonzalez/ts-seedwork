import type { Query, QueryBus, QueryHandler } from '../application/queries.js';
import { RegistryQueryBus } from './registry-query-bus.js';
import { ValidationQueryBus } from './validation-query-bus.js';

export class QueryBusBuilder {
  private readonly registry = new RegistryQueryBus();
  private readonly steps: Array<(inner: QueryBus) => QueryBus> = [];

  register<TQuery extends Query, TResult>(
    queryType: new (..._args: any[]) => TQuery,
    handler: QueryHandler<TQuery, TResult>
  ): this {
    this.registry.register(queryType, handler);
    return this;
  }

  withValidation(): this {
    this.steps.push(inner => new ValidationQueryBus(inner));
    return this;
  }

  use(factory: (inner: QueryBus) => QueryBus): this {
    this.steps.push(factory);
    return this;
  }

  build(): QueryBus {
    let bus: QueryBus = this.registry;
    for (const step of [...this.steps].reverse()) {
      bus = step(bus);
    }
    return bus;
  }
}
