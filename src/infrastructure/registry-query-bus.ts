import type { Maybe, Query, QueryBus, QueryHandler } from '../application/queries.js';

type HandlerForQuery = QueryHandler<Query, unknown>;

export class RegistryQueryBus implements QueryBus {
  private readonly handlers = new Map<Function, HandlerForQuery>();

  public register<TQuery extends Query, TResult>(
    queryType: new (..._args: any[]) => TQuery,
    handler: QueryHandler<TQuery, TResult>
  ): void {
    this.handlers.set(queryType, handler as HandlerForQuery);
  }

  public async ask<TResult>(query: Query): Promise<Maybe<TResult>> {
    const handler = this.handlers.get(query.constructor);
    if (!handler) {
      throw new Error(`No handler registered for query: ${query.constructor.name}`);
    }
    return handler.execute(query) as Promise<Maybe<TResult>>;
  }
}
