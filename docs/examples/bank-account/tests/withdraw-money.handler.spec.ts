import {
  DomainEvent,
  DomainEventBusPublisher,
  DomainEventPublishingRepository,
  RegistryCommandBus,
  ValidationCommandBus,
  ValidationErrors,
} from '@aseguragonzalez/ts-seedwork';

import { DepositMoneyCommand } from '../application/deposit-money/deposit-money.command.js';
import { DepositMoneyHandler } from '../application/deposit-money/deposit-money.handler.js';
import { OpenAccountCommand } from '../application/open-account/open-account.command.js';
import { OpenAccountHandler } from '../application/open-account/open-account.handler.js';
import { WithdrawMoneyCommand } from '../application/withdraw-money/withdraw-money.command.js';
import { WithdrawMoneyHandler } from '../application/withdraw-money/withdraw-money.handler.js';
import { BankAccountId } from '../domain/bank-account-id.js';
import { MoneyWithdrawn } from '../domain/events/money-withdrawn.js';
import { InMemoryBankAccountRepository } from '../infrastructure/in-memory-bank-account.repository.js';

describe('WithdrawMoneyHandler', () => {
  let innerRepo: InMemoryBankAccountRepository;
  let published: DomainEvent[];
  let bus: ValidationCommandBus;

  beforeEach(async () => {
    innerRepo = new InMemoryBankAccountRepository();
    published = [];
    const publisher: DomainEventBusPublisher = {
      publish: async (events: ReadonlyArray<DomainEvent>) => {
        published.push(...events);
      },
    };
    const repository = new DomainEventPublishingRepository(innerRepo, publisher);
    const registry = new RegistryCommandBus();
    registry.register(OpenAccountCommand, new OpenAccountHandler(repository));
    registry.register(DepositMoneyCommand, new DepositMoneyHandler(repository));
    registry.register(WithdrawMoneyCommand, new WithdrawMoneyHandler(repository));
    bus = new ValidationCommandBus(registry);
    await bus.dispatch(new OpenAccountCommand('acc-1', 'Alice', 200, 'EUR'));
    published = [];
  });

  it('decreases the account balance after withdrawal', async () => {
    const result = await bus.dispatch(new WithdrawMoneyCommand('acc-1', 50, 'EUR'));

    expect(result.isOk()).toBe(true);
    const account = await innerRepo.findById(new BankAccountId('acc-1'));
    expect(account?.balance.amount).toBe(150);
  });

  it('publishes a MoneyWithdrawn event', async () => {
    await bus.dispatch(new WithdrawMoneyCommand('acc-1', 50, 'EUR'));

    expect(published).toHaveLength(1);
    expect(published[0]).toBeInstanceOf(MoneyWithdrawn);
  });

  it('returns Fail when account does not exist', async () => {
    const result = await bus.dispatch(new WithdrawMoneyCommand('unknown', 50, 'EUR'));

    expect(result.isFailed()).toBe(true);
    expect(result.errors[0].code).toBe('NOT_FOUND');
  });

  it('returns Fail on insufficient funds', async () => {
    const result = await bus.dispatch(new WithdrawMoneyCommand('acc-1', 500, 'EUR'));

    expect(result.isFailed()).toBe(true);
    expect(result.errors[0].code).toBe('INSUFFICIENT_FUNDS');
  });

  it('throws ValidationErrors when amount is not positive', async () => {
    await expect(bus.dispatch(new WithdrawMoneyCommand('acc-1', 0, 'EUR'))).rejects.toThrow(ValidationErrors);
  });
});
