import type { Query, QueryBus, QueryHandler } from '../application/queries.js';
import { RegistryQueryBus } from './registry-query-bus.js';
import { ValidationQueryBus } from './validation-query-bus.js';

export class QueryBusBuilder {
  private readonly registry = new RegistryQueryBus();
  private addValidation = false;

  register<TQuery extends Query, TResult>(
    queryType: new (..._args: any[]) => TQuery,
    handler: QueryHandler<TQuery, TResult>
  ): this {
    this.registry.register(queryType, handler);
    return this;
  }

  withValidation(): this {
    this.addValidation = true;
    return this;
  }

  build(): QueryBus {
    let bus: QueryBus = this.registry;
    if (this.addValidation) {
      bus = new ValidationQueryBus(bus);
    }
    return bus;
  }
}
