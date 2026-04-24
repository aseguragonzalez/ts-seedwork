import { DeferredDomainEventBus, RegistryCommandBus } from '@seedwork';

import { OpenAccountCommand } from '../application/open-account/open-account.command.js';
import { OpenAccountHandler } from '../application/open-account/open-account.handler.js';
import { BankAccountId } from '../domain/bank-account-id.js';
import { AccountOpened } from '../domain/events/account-opened.js';
import { InMemoryBankAccountRepository } from '../infrastructure/in-memory-bank-account.repository.js';

describe('OpenAccountHandler', () => {
  let repository: InMemoryBankAccountRepository;
  let eventBus: DeferredDomainEventBus;
  let bus: RegistryCommandBus;

  beforeEach(() => {
    repository = new InMemoryBankAccountRepository();
    eventBus = new DeferredDomainEventBus();
    const handler = new OpenAccountHandler(repository, eventBus);
    bus = new RegistryCommandBus();
    bus.register(OpenAccountCommand, handler);
  });

  it('saves the new account to the repository', async () => {
    await bus.dispatch(new OpenAccountCommand('acc-1', 'Alice', 100, 'EUR'));
    const saved = await repository.getById(new BankAccountId('acc-1'));
    expect(saved).not.toBeNull();
    expect(saved?.owner).toBe('Alice');
    expect(saved?.balance.amount).toBe(100);
  });

  it('publishes an AccountOpened event', async () => {
    const published: unknown[] = [];
    eventBus.subscribe('AccountOpened', [{ handle: async e => void published.push(e) }]);

    await bus.dispatch(new OpenAccountCommand('acc-1', 'Alice', 100, 'EUR'));
    await eventBus.flush();

    expect(published).toHaveLength(1);
    expect(published[0]).toBeInstanceOf(AccountOpened);
  });
});
