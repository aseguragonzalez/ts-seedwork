import type { Query, QueryBus, QueryHandler } from '@seedwork';
import { Maybe, ValidationErrors } from '@seedwork';
import { QueryBusBuilder } from '@seedwork/infrastructure/query-bus-builder';

class GetSomething implements Query {
  constructor(public readonly valid: boolean = true) {}
  validate(): void {
    if (!this.valid) throw new ValidationErrors([{ code: 'INVALID', message: 'invalid' }]);
  }
}

class GetSomethingHandler implements QueryHandler<GetSomething, string> {
  public calls = 0;
  async execute(_query: GetSomething): Promise<Maybe<string>> {
    this.calls++;
    return Maybe.just('result');
  }
}

class NotFoundHandler implements QueryHandler<GetSomething, string> {
  async execute(_query: GetSomething): Promise<Maybe<string>> {
    return Maybe.nothing();
  }
}

const makeSpy = () => {
  const calls: string[] = [];
  const factory = (inner: QueryBus): QueryBus => ({
    async ask<TResult>(query: Query): Promise<Maybe<TResult>> {
      calls.push('before');
      const result = await inner.ask<TResult>(query);
      calls.push('after');
      return result;
    },
  });
  return { factory, calls };
};

describe('QueryBusBuilder', () => {
  describe('base registry', () => {
    it('dispatches to registered handler and returns Just', async () => {
      const handler = new GetSomethingHandler();
      const bus = new QueryBusBuilder().register(GetSomething, handler).build();

      const result = await bus.ask<string>(new GetSomething());

      expect(result.isJust()).toBe(true);
      expect(result.value).toBe('result');
      expect(handler.calls).toBe(1);
    });

    it('returns Nothing when handler returns nothing', async () => {
      const bus = new QueryBusBuilder().register(GetSomething, new NotFoundHandler()).build();

      const result = await bus.ask<string>(new GetSomething());

      expect(result.isNothing()).toBe(true);
    });

    it('throws when no handler is registered', async () => {
      const bus = new QueryBusBuilder().build();

      await expect(bus.ask(new GetSomething())).rejects.toThrow('No handler registered');
    });
  });

  describe('withValidation', () => {
    it('dispatches when query is valid', async () => {
      const handler = new GetSomethingHandler();
      const bus = new QueryBusBuilder().register(GetSomething, handler).withValidation().build();

      const result = await bus.ask<string>(new GetSomething(true));

      expect(result.isJust()).toBe(true);
      expect(handler.calls).toBe(1);
    });

    it('throws ValidationErrors before reaching handler when query is invalid', async () => {
      const handler = new GetSomethingHandler();
      const bus = new QueryBusBuilder().register(GetSomething, handler).withValidation().build();

      await expect(bus.ask(new GetSomething(false))).rejects.toThrow(ValidationErrors);
      expect(handler.calls).toBe(0);
    });
  });

  describe('use (custom steps)', () => {
    it('custom step is invoked during ask', async () => {
      const handler = new GetSomethingHandler();
      const { factory, calls } = makeSpy();
      const bus = new QueryBusBuilder().register(GetSomething, handler).use(factory).build();

      await bus.ask<string>(new GetSomething());

      expect(calls).toEqual(['before', 'after']);
      expect(handler.calls).toBe(1);
    });

    it('custom step declared after withValidation runs inside validation', async () => {
      const handler = new GetSomethingHandler();
      const { factory, calls } = makeSpy();
      const bus = new QueryBusBuilder().register(GetSomething, handler).withValidation().use(factory).build();

      await expect(bus.ask(new GetSomething(false))).rejects.toThrow(ValidationErrors);
      expect(calls).toHaveLength(0);
    });

    it('multiple custom steps run in declaration order', async () => {
      const order: number[] = [];
      const makeOrderedSpy =
        (id: number) =>
        (inner: QueryBus): QueryBus => ({
          async ask<TResult>(query: Query): Promise<Maybe<TResult>> {
            order.push(id);
            return inner.ask<TResult>(query);
          },
        });

      const bus = new QueryBusBuilder()
        .register(GetSomething, new GetSomethingHandler())
        .use(makeOrderedSpy(1))
        .use(makeOrderedSpy(2))
        .use(makeOrderedSpy(3))
        .build();

      await bus.ask<string>(new GetSomething());

      expect(order).toEqual([1, 2, 3]);
    });
  });
});
