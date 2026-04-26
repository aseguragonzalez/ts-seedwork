import type { Maybe, Query, QueryBus } from '../application/queries.js';

export class ValidationQueryBus implements QueryBus {
  public constructor(private readonly inner: QueryBus) {}

  public async ask<TResult>(query: Query): Promise<Maybe<TResult>> {
    query.validate();
    return this.inner.ask<TResult>(query);
  }
}
