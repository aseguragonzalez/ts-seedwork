import {
  DomainEvent,
  DomainEventPublisher,
  DomainEventPublishingRepository,
  RegistryCommandBus,
  ValidationCommandBus,
  ValidationErrors,
} from '@seedwork';

import { OpenAccountCommand } from '../application/open-account/open-account.command.js';
import { OpenAccountHandler } from '../application/open-account/open-account.handler.js';
import { BankAccountId } from '../domain/bank-account-id.js';
import { AccountOpened } from '../domain/events/account-opened.js';
import { InMemoryBankAccountRepository } from '../infrastructure/in-memory-bank-account.repository.js';

describe('OpenAccountHandler', () => {
  let innerRepo: InMemoryBankAccountRepository;
  let published: DomainEvent[];
  let bus: ValidationCommandBus;

  beforeEach(() => {
    innerRepo = new InMemoryBankAccountRepository();
    published = [];
    const publisher: DomainEventPublisher = {
      publish: async events => {
        published.push(...events);
      },
    };
    const repository = new DomainEventPublishingRepository(innerRepo, publisher);
    const registry = new RegistryCommandBus();
    registry.register(OpenAccountCommand, new OpenAccountHandler(repository));
    bus = new ValidationCommandBus(registry);
  });

  it('saves the new account to the repository', async () => {
    const result = await bus.dispatch(new OpenAccountCommand('acc-1', 'Alice', 100, 'EUR'));

    expect(result.isOk()).toBe(true);
    const saved = await innerRepo.findById(new BankAccountId('acc-1'));
    expect(saved).not.toBeNull();
    expect(saved?.owner).toBe('Alice');
    expect(saved?.balance.amount).toBe(100);
  });

  it('publishes an AccountOpened event', async () => {
    await bus.dispatch(new OpenAccountCommand('acc-1', 'Alice', 100, 'EUR'));

    expect(published).toHaveLength(1);
    expect(published[0]).toBeInstanceOf(AccountOpened);
  });

  it('throws ValidationErrors when owner is empty', async () => {
    await expect(bus.dispatch(new OpenAccountCommand('acc-1', '', 100, 'EUR'))).rejects.toThrow(ValidationErrors);
  });

  it('throws ValidationErrors with all details when multiple fields are invalid', async () => {
    try {
      await bus.dispatch(new OpenAccountCommand('', '', -1, ''));
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationErrors);
      if (e instanceof ValidationErrors) {
        expect(e.errors.length).toBeGreaterThan(1);
      }
    }
  });
});
