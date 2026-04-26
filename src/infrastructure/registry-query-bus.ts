import type { Maybe, Query, QueryBus, QueryHandler } from '../application/queries.js';

type HandlerForQuery = QueryHandler<Query, unknown>;

export class RegistryQueryBus implements QueryBus {
  private readonly handlers = new Map<Function, HandlerForQuery>();

  public register<T extends Query, R>(queryType: new (..._args: any[]) => T, handler: QueryHandler<T, R>): void {
    this.handlers.set(queryType, handler as HandlerForQuery);
  }

  public async ask<T>(query: Query): Promise<Maybe<T>> {
    const handler = this.handlers.get(query.constructor);
    if (!handler) {
      throw new Error(`No handler registered for query: ${query.constructor.name}`);
    }
    return handler.execute(query) as Promise<Maybe<T>>;
  }
}
