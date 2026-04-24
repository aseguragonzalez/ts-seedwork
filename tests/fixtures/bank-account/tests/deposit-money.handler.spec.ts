import { DeferredDomainEventBus, DomainError, RegistryCommandBus } from '@seedwork';

import { DepositMoneyCommand } from '../application/deposit-money/deposit-money.command.js';
import { DepositMoneyHandler } from '../application/deposit-money/deposit-money.handler.js';
import { OpenAccountCommand } from '../application/open-account/open-account.command.js';
import { OpenAccountHandler } from '../application/open-account/open-account.handler.js';
import { BankAccountId } from '../domain/bank-account-id.js';
import { MoneyDeposited } from '../domain/events/money-deposited.js';
import { InMemoryBankAccountRepository } from '../infrastructure/in-memory-bank-account.repository.js';

describe('DepositMoneyHandler', () => {
  let repository: InMemoryBankAccountRepository;
  let eventBus: DeferredDomainEventBus;
  let bus: RegistryCommandBus;

  beforeEach(async () => {
    repository = new InMemoryBankAccountRepository();
    eventBus = new DeferredDomainEventBus();
    bus = new RegistryCommandBus();
    bus.register(OpenAccountCommand, new OpenAccountHandler(repository, eventBus));
    bus.register(DepositMoneyCommand, new DepositMoneyHandler(repository, eventBus));
    await bus.dispatch(new OpenAccountCommand('acc-1', 'Alice', 100, 'EUR'));
  });

  it('updates the account balance after deposit', async () => {
    await bus.dispatch(new DepositMoneyCommand('acc-1', 50, 'EUR'));
    const account = await repository.getById(new BankAccountId('acc-1'));
    expect(account?.balance.amount).toBe(150);
  });

  it('publishes a MoneyDeposited event', async () => {
    const published: unknown[] = [];
    eventBus.subscribe('MoneyDeposited', [{ handle: async e => void published.push(e) }]);

    await bus.dispatch(new DepositMoneyCommand('acc-1', 50, 'EUR'));
    await eventBus.flush();

    expect(published).toHaveLength(1);
    expect(published[0]).toBeInstanceOf(MoneyDeposited);
  });

  it('throws DomainError when account does not exist', async () => {
    await expect(bus.dispatch(new DepositMoneyCommand('unknown', 50, 'EUR'))).rejects.toThrow(DomainError);
  });
});
