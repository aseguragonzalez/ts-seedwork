import { AccountOpenedIntegrationEvent } from '../application/account-opened.integration-event.js';
import { buildCommandBus } from '../application/composition-root.js';
import { DepositMoneyCommand } from '../application/deposit-money/deposit-money.command.js';
import { OpenAccountCommand } from '../application/open-account/open-account.command.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('Composition root — OpenAccountCommand end-to-end', () => {
  it('dispatches the domain event and publishes the integration event', async () => {
    const { commandBus, integrationEventPublisher } = buildCommandBus();

    const result = await commandBus.dispatch(new OpenAccountCommand('acc-1', 'Alice', 100, 'EUR'));

    expect(result.isOk()).toBe(true);
    expect(integrationEventPublisher.published).toHaveLength(1);

    const event = integrationEventPublisher.published[0];
    expect(event).toBeInstanceOf(AccountOpenedIntegrationEvent);
    expect(event.type).toBe('banking.bank_account.account_opened');
    expect(event.version).toBe('1.0');
    expect(event.aggregateId).toBe('acc-1');
    expect(event.payload).toEqual({ accountId: 'acc-1', owner: 'Alice', amount: 100, currency: 'EUR' });
    expect(event.causationId).toMatch(UUID_RE);
    expect(event.correlationId).toMatch(UUID_RE);
  });

  it('does not publish integration events when the command returns a domain failure', async () => {
    const { commandBus, integrationEventPublisher } = buildCommandBus();

    // Deposit on a non-existent account — handler throws AccountNotFoundError → Result.fail
    const result = await commandBus.dispatch(new DepositMoneyCommand('unknown', 50, 'EUR'));

    expect(result.isFail()).toBe(true);
    expect(integrationEventPublisher.published).toHaveLength(0);
  });
});
