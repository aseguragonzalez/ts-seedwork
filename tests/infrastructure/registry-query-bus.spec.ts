import type { Query, QueryHandler, QueryResponse } from '@seedwork/application/queries';
import { RegistryQueryBus } from '@seedwork/infrastructure/registry-query-bus';

class GetUserQuery implements Query {
  constructor(public readonly id: string) {}
}

interface UserResponse extends QueryResponse<{ id: string; name: string }> {}

class GetUserHandler implements QueryHandler<GetUserQuery, UserResponse> {
  async execute(query: GetUserQuery): Promise<UserResponse> {
    return { data: { id: query.id, name: 'Alice' } };
  }
}

describe('RegistryQueryBus', () => {
  it('should dispatch to the registered handler and return result', async () => {
    const bus = new RegistryQueryBus();
    bus.register(GetUserQuery, new GetUserHandler());

    const result = await bus.ask<UserResponse>(new GetUserQuery('123'));

    expect(result.data).toEqual({ id: '123', name: 'Alice' });
  });

  it('should throw when no handler is registered', async () => {
    const bus = new RegistryQueryBus();

    await expect(bus.ask(new GetUserQuery('123'))).rejects.toThrow('No handler registered for query: GetUserQuery');
  });

  it('should allow overwriting a registered handler', async () => {
    const bus = new RegistryQueryBus();

    class AltGetUserHandler implements QueryHandler<GetUserQuery, UserResponse> {
      async execute(query: GetUserQuery): Promise<UserResponse> {
        return { data: { id: query.id, name: 'Bob' } };
      }
    }

    bus.register(GetUserQuery, new GetUserHandler());
    bus.register(GetUserQuery, new AltGetUserHandler());

    const result = await bus.ask<UserResponse>(new GetUserQuery('123'));
    expect(result.data.name).toBe('Bob');
  });
});
