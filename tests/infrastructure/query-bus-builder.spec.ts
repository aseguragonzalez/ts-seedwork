import type { Query, QueryHandler } from '@seedwork';
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

    it('calling withValidation twice is idempotent', async () => {
      const handler = new GetSomethingHandler();
      const bus = new QueryBusBuilder().register(GetSomething, handler).withValidation().withValidation().build();

      const result = await bus.ask<string>(new GetSomething(true));

      expect(result.isJust()).toBe(true);
      expect(handler.calls).toBe(1);
    });
  });
});
