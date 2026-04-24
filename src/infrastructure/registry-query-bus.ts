import type { Query, QueryBus, QueryHandler, QueryResponse } from '../application/queries.js';

type HandlerForQuery = QueryHandler<Query, QueryResponse<unknown>>;

export class RegistryQueryBus implements QueryBus {
  private readonly handlers = new Map<Function, HandlerForQuery>();

  public register<T extends Query, R extends QueryResponse<unknown>>(
    queryType: new (..._args: any[]) => T,
    handler: QueryHandler<T, R>
  ): void {
    this.handlers.set(queryType, handler as HandlerForQuery);
  }

  public async ask<TResult extends QueryResponse<unknown>>(query: Query): Promise<TResult> {
    const handler = this.handlers.get(query.constructor);
    if (!handler) {
      throw new Error(`No handler registered for query: ${query.constructor.name}`);
    }
    return handler.execute(query) as Promise<TResult>;
  }
}
