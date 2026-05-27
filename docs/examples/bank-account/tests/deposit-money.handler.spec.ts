import {
  DomainEvent,
  DomainEventBusPublisher,
  DomainEventPublishingRepository,
  RegistryCommandBus,
  ValidationErrors,
} from '@aseguragonzalez/ts-seedwork';

import { DepositMoneyCommand } from '../application/deposit-money/deposit-money.command.js';
import { DepositMoneyHandler } from '../application/deposit-money/deposit-money.handler.js';
import { OpenAccountCommand } from '../application/open-account/open-account.command.js';
import { OpenAccountHandler } from '../application/open-account/open-account.handler.js';
import { BankAccountId } from '../domain/bank-account-id.js';
import { MoneyDeposited } from '../domain/events/money-deposited.js';
import { InMemoryBankAccountRepository } from '../infrastructure/in-memory-bank-account.repository.js';

describe('DepositMoneyHandler', () => {
  let innerRepo: InMemoryBankAccountRepository;
  let published: DomainEvent[];
  let bus: RegistryCommandBus;

  beforeEach(async () => {
    innerRepo = new InMemoryBankAccountRepository();
    published = [];
    const publisher: DomainEventBusPublisher = {
      publish: async (events: ReadonlyArray<DomainEvent>) => {
        published.push(...events);
      },
    };
    const repository = new DomainEventPublishingRepository(innerRepo, publisher);
    bus = new RegistryCommandBus();
    bus.register(OpenAccountCommand, new OpenAccountHandler(repository));
    bus.register(DepositMoneyCommand, new DepositMoneyHandler(repository));
    await bus.dispatch(new OpenAccountCommand('acc-1', 'Alice', 100, 'EUR'));
    published = [];
  });

  it('updates the account balance after deposit', async () => {
    const result = await bus.dispatch(new DepositMoneyCommand('acc-1', 50, 'EUR'));

    expect(result.isOk()).toBe(true);
    const account = await innerRepo.findById(new BankAccountId('acc-1'));
    expect(account?.balance.amount).toBe(150);
  });

  it('publishes a MoneyDeposited event', async () => {
    await bus.dispatch(new DepositMoneyCommand('acc-1', 50, 'EUR'));

    expect(published).toHaveLength(1);
    expect(published[0]).toBeInstanceOf(MoneyDeposited);
  });

  it('returns Fail when account does not exist', async () => {
    const result = await bus.dispatch(new DepositMoneyCommand('unknown', 50, 'EUR'));

    expect(result.isFailed()).toBe(true);
    expect(result.errors[0].code).toBe('NOT_FOUND');
  });

  it('throws ValidationErrors when amount is not positive', () => {
    expect(() => new DepositMoneyCommand('acc-1', 0, 'EUR')).toThrow(ValidationErrors);
  });
});
