import type { Query, QueryHandler } from '@seedwork/application/queries';
import { Maybe } from '@seedwork/application/queries';
import { RegistryQueryBus } from '@seedwork/infrastructure/registry-query-bus';

interface UserData {
  id: string;
  name: string;
}

class GetUserQuery implements Query {
  constructor(public readonly id: string) {}
  validate(): void {}
}

class GetUserHandler implements QueryHandler<GetUserQuery, UserData> {
  async execute(query: GetUserQuery): Promise<Maybe<UserData>> {
    return Maybe.just({ id: query.id, name: 'Alice' });
  }
}

describe('RegistryQueryBus', () => {
  it('should dispatch to the registered handler and return result', async () => {
    const bus = new RegistryQueryBus();
    bus.register(GetUserQuery, new GetUserHandler());

    const result = await bus.ask<UserData>(new GetUserQuery('123'));

    expect(result.isJust()).toBe(true);
    if (result.isJust()) {
      expect(result.value).toEqual({ id: '123', name: 'Alice' });
    }
  });

  it('should throw when no handler is registered', async () => {
    const bus = new RegistryQueryBus();

    await expect(bus.ask(new GetUserQuery('123'))).rejects.toThrow('No handler registered for query: GetUserQuery');
  });

  it('should allow overwriting a registered handler', async () => {
    const bus = new RegistryQueryBus();

    class AltGetUserHandler implements QueryHandler<GetUserQuery, UserData> {
      async execute(query: GetUserQuery): Promise<Maybe<UserData>> {
        return Maybe.just({ id: query.id, name: 'Bob' });
      }
    }

    bus.register(GetUserQuery, new GetUserHandler());
    bus.register(GetUserQuery, new AltGetUserHandler());

    const result = await bus.ask<UserData>(new GetUserQuery('123'));
    expect(result.isJust()).toBe(true);
    if (result.isJust()) {
      expect(result.value.name).toBe('Bob');
    }
  });
});
