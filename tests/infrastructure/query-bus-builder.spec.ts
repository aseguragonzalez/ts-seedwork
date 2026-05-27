import { Maybe, Query, type QueryBus, type QueryHandler } from '@src';
import { QueryBusBuilder } from '@src/infrastructure/query-bus-builder';

class GetSomething extends Query {
  constructor() {
    super();
    this.validate();
  }
  protected validate(): void {}
}

class GetSomethingHandler implements QueryHandler<GetSomething, string> {
  public calls = 0;
  async handle(_query: GetSomething): Promise<Maybe<string>> {
    this.calls++;
    return Maybe.just('result');
  }
}

class NotFoundHandler implements QueryHandler<GetSomething, string> {
  async handle(_query: GetSomething): Promise<Maybe<string>> {
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

  describe('use (custom steps)', () => {
    it('custom step is invoked during ask', async () => {
      const handler = new GetSomethingHandler();
      const { factory, calls } = makeSpy();
      const bus = new QueryBusBuilder().register(GetSomething, handler).use(factory).build();

      await bus.ask<string>(new GetSomething());

      expect(calls).toEqual(['before', 'after']);
      expect(handler.calls).toBe(1);
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
