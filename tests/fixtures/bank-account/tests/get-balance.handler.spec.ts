import { DeferredDomainEventBus, DomainError, RegistryCommandBus, RegistryQueryBus } from '@seedwork';

import { GetBalanceHandler } from '../application/get-balance/get-balance.handler.js';
import { GetBalanceQuery } from '../application/get-balance/get-balance.query.js';
import { GetBalanceResponse } from '../application/get-balance/get-balance.response.js';
import { OpenAccountCommand } from '../application/open-account/open-account.command.js';
import { OpenAccountHandler } from '../application/open-account/open-account.handler.js';
import { InMemoryBankAccountRepository } from '../infrastructure/in-memory-bank-account.repository.js';

describe('GetBalanceHandler', () => {
  let repository: InMemoryBankAccountRepository;
  let commandBus: RegistryCommandBus;
  let queryBus: RegistryQueryBus;

  beforeEach(async () => {
    repository = new InMemoryBankAccountRepository();
    const eventBus = new DeferredDomainEventBus();
    commandBus = new RegistryCommandBus();
    commandBus.register(OpenAccountCommand, new OpenAccountHandler(repository, eventBus));
    queryBus = new RegistryQueryBus();
    queryBus.register(GetBalanceQuery, new GetBalanceHandler(repository));
    await commandBus.dispatch(new OpenAccountCommand('acc-1', 'Alice', 250, 'EUR'));
  });

  it('returns the current balance for an existing account', async () => {
    const result = await queryBus.ask<GetBalanceResponse>(new GetBalanceQuery('acc-1'));
    expect(result.data.accountId).toBe('acc-1');
    expect(result.data.owner).toBe('Alice');
    expect(result.data.amount).toBe(250);
    expect(result.data.currency).toBe('EUR');
  });

  it('throws DomainError when account does not exist', async () => {
    await expect(queryBus.ask(new GetBalanceQuery('unknown'))).rejects.toThrow(DomainError);
  });
});
