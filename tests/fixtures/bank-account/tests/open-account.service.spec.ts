import { DomainEvent, DomainEventPublisher, DomainEventPublishingRepository, ValidationErrors } from '@seedwork';

import { OpenAccountRequest } from '../application/open-account-service/open-account.request.js';
import { OpenAccountService } from '../application/open-account-service/open-account.service.js';
import { InMemoryBankAccountRepository } from '../infrastructure/in-memory-bank-account.repository.js';

describe('OpenAccountService', () => {
  let innerRepo: InMemoryBankAccountRepository;
  let published: DomainEvent[];
  let service: OpenAccountService;

  beforeEach(() => {
    innerRepo = new InMemoryBankAccountRepository();
    published = [];
    const publisher: DomainEventPublisher = {
      publish: async events => {
        published.push(...events);
      },
    };
    const repository = new DomainEventPublishingRepository(innerRepo, publisher);
    service = new OpenAccountService(repository);
  });

  it('opens an account and returns the generated accountId', async () => {
    const request = new OpenAccountRequest('Alice', 100, 'EUR');

    const response = await service.execute(request);

    expect(response.accountId).toBeDefined();
    const saved = await innerRepo.findById({ value: response.accountId } as any);
    expect(saved?.owner).toBe('Alice');
    expect(saved?.balance.amount).toBe(100);
  });

  it('generates a different accountId on each call', async () => {
    const first = await service.execute(new OpenAccountRequest('Alice', 100, 'EUR'));
    const second = await service.execute(new OpenAccountRequest('Bob', 200, 'USD'));

    expect(first.accountId).not.toBe(second.accountId);
  });

  it('throws ValidationErrors when the request is invalid', async () => {
    const request = new OpenAccountRequest('', -10, '');

    await expect(service.execute(request)).rejects.toBeInstanceOf(ValidationErrors);
  });

  it('publishes domain events after opening', async () => {
    await service.execute(new OpenAccountRequest('Carol', 50, 'GBP'));

    expect(published).toHaveLength(1);
    expect(published[0].eventName).toBe('AccountOpened');
  });
});
