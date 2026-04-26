import type { Maybe, Query, QueryBus } from '../application/queries.js';

export class ValidationQueryBus implements QueryBus {
  public constructor(private readonly inner: QueryBus) {}

  public async ask<T>(query: Query): Promise<Maybe<T>> {
    query.validate();
    return this.inner.ask<T>(query);
  }
}
