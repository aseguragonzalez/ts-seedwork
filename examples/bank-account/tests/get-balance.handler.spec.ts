import { DomainEventPublisher, DomainEventPublishingRepository, RegistryCommandBus, RegistryQueryBus } from '@seedwork';

import { GetBalanceHandler } from '../application/get-balance/get-balance.handler.js';
import { GetBalanceQuery } from '../application/get-balance/get-balance.query.js';
import type { BalanceData } from '../application/get-balance/get-balance.response.js';
import { OpenAccountCommand } from '../application/open-account/open-account.command.js';
import { OpenAccountHandler } from '../application/open-account/open-account.handler.js';
import { InMemoryBankAccountRepository } from '../infrastructure/in-memory-bank-account.repository.js';

describe('GetBalanceHandler', () => {
  let innerRepo: InMemoryBankAccountRepository;
  let commandBus: RegistryCommandBus;
  let queryBus: RegistryQueryBus;

  beforeEach(async () => {
    innerRepo = new InMemoryBankAccountRepository();
    const publisher: DomainEventPublisher = { publish: async () => {} };
    const repository = new DomainEventPublishingRepository(innerRepo, publisher);
    commandBus = new RegistryCommandBus();
    commandBus.register(OpenAccountCommand, new OpenAccountHandler(repository));
    queryBus = new RegistryQueryBus();
    queryBus.register(GetBalanceQuery, new GetBalanceHandler(innerRepo));
    await commandBus.dispatch(new OpenAccountCommand('acc-1', 'Alice', 250, 'EUR'));
  });

  it('returns Just with the current balance for an existing account', async () => {
    const result = await queryBus.ask<BalanceData>(new GetBalanceQuery('acc-1'));

    expect(result.isJust()).toBe(true);
    if (result.isJust()) {
      expect(result.value.accountId).toBe('acc-1');
      expect(result.value.owner).toBe('Alice');
      expect(result.value.amount).toBe(250);
      expect(result.value.currency).toBe('EUR');
    }
  });

  it('returns Nothing when account does not exist', async () => {
    const result = await queryBus.ask<BalanceData>(new GetBalanceQuery('unknown'));

    expect(result.isNothing()).toBe(true);
  });
});
