export class Maybe<T> {
  readonly value: T | undefined;

  private constructor(value: T | undefined) {
    this.value = value;
  }

  static just<T>(value: T): Maybe<T> {
    return new Maybe(value);
  }

  static nothing<T = never>(): Maybe<T> {
    return new Maybe<T>(undefined);
  }

  isJust(): this is Maybe<T> & { readonly value: T } {
    return this.value !== undefined;
  }

  isNothing(): boolean {
    return this.value === undefined;
  }
}

export interface Query {
  validate(): void;
}

export interface QueryHandler<TQuery extends Query, TResult> {
  execute(query: TQuery): Promise<Maybe<TResult>>;
}

export interface QueryBus {
  ask<TResult>(query: Query): Promise<Maybe<TResult>>;
}
