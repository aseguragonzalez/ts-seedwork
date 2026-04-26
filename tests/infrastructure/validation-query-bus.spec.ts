import { ValidationErrors } from '@seedwork';
import type { Query, QueryBus } from '@seedwork/application/queries';
import { Maybe } from '@seedwork/application/queries';
import { ValidationQueryBus } from '@seedwork/infrastructure/validation-query-bus';

interface UserData {
  id: string;
}

class QueryWithValidation implements Query {
  constructor(public readonly id: string) {}
  validate(): void {}
}

class QueryWithInvalidData implements Query {
  validate(): void {
    throw new ValidationErrors([{ code: 'REQUIRED_ID', message: 'Id is required' }]);
  }
}

class QueryWithNoOpValidation implements Query {
  constructor(public readonly id: string) {}
  validate(): void {}
}

describe('ValidationQueryBus', () => {
  it('calls validate and delegates to inner bus when valid', async () => {
    const inner: QueryBus = { ask: jest.fn().mockResolvedValue(Maybe.just({ id: '1' })) };
    const bus = new ValidationQueryBus(inner);
    const query = new QueryWithValidation('1');
    jest.spyOn(query, 'validate');

    const result = await bus.ask<UserData>(query);

    expect(query.validate).toHaveBeenCalledTimes(1);
    expect(inner.ask).toHaveBeenCalledWith(query);
    expect(result.isJust()).toBe(true);
  });

  it('throws ValidationErrors before reaching inner bus', async () => {
    const inner: QueryBus = { ask: jest.fn() };
    const bus = new ValidationQueryBus(inner);

    await expect(bus.ask(new QueryWithInvalidData())).rejects.toThrow(ValidationErrors);
    expect(inner.ask).not.toHaveBeenCalled();
  });

  it('propagates ValidationErrors with error details', async () => {
    const inner: QueryBus = { ask: jest.fn() };
    const bus = new ValidationQueryBus(inner);

    try {
      await bus.ask(new QueryWithInvalidData());
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationErrors);
      if (e instanceof ValidationErrors) {
        expect(e.errors[0].code).toBe('REQUIRED_ID');
      }
    }
  });

  it('delegates to inner bus when validate is a no-op', async () => {
    const inner: QueryBus = { ask: jest.fn().mockResolvedValue(Maybe.nothing()) };
    const bus = new ValidationQueryBus(inner);

    const result = await bus.ask(new QueryWithNoOpValidation('x'));

    expect(inner.ask).toHaveBeenCalledTimes(1);
    expect(result.isNothing()).toBe(true);
  });
});
