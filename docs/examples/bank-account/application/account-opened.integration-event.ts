import { BaseIntegrationEvent } from '@aseguragonzalez/ts-seedwork';

import { AccountOpened } from '../domain/events/account-opened.js';
import { correlationContext } from './correlation-context.js';

type AccountOpenedIntegrationEventPayload = {
  accountId: string;
  owner: string;
  amount: number;
  currency: string;
};

export class AccountOpenedIntegrationEvent extends BaseIntegrationEvent {
  static create(event: AccountOpened): AccountOpenedIntegrationEvent {
    const correlationId = correlationContext.getStore() ?? crypto.randomUUID();
    return new AccountOpenedIntegrationEvent(
      event.aggregateId,
      {
        accountId: event.payload.accountId,
        owner: event.payload.owner,
        amount: event.payload.amount,
        currency: event.payload.currency,
      },
      correlationId,
      event.id
    );
  }

  private constructor(
    aggregateId: string,
    payload: AccountOpenedIntegrationEventPayload,
    correlationId: string,
    causationId: string
  ) {
    super('banking.bank_account.account_opened', '1.0', aggregateId, payload, correlationId, causationId);
  }
}
