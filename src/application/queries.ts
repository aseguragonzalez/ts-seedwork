export interface Query {}

export interface QueryResponse<TProjection> {
  data: TProjection;
}

export interface QueryHandler<TQuery extends Query, TResult extends QueryResponse<unknown>> {
  execute(query: TQuery): Promise<TResult>;
}

export interface QueryBus {
  ask<TResult extends QueryResponse<unknown>>(query: Query): Promise<TResult>;
}
