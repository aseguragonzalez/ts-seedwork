import { BaseIntegrationEvent } from '@aseguragonzalez/ts-seedwork';

import { AccountOpened } from '../domain/events/account-opened.js';

type AccountOpenedIntegrationEventPayload = {
  accountId: string;
  owner: string;
  amount: number;
  currency: string;
};

export class AccountOpenedIntegrationEvent extends BaseIntegrationEvent {
  static create(event: AccountOpened): AccountOpenedIntegrationEvent {
    return new AccountOpenedIntegrationEvent(
      event.payload.accountId,
      {
        accountId: event.payload.accountId,
        owner: event.payload.owner,
        amount: event.payload.amount,
        currency: event.payload.currency,
      },
      event.id
    );
  }

  private constructor(aggregateId: string, payload: AccountOpenedIntegrationEventPayload, correlationId: string) {
    super('banking.bank_account.account_opened', '1.0', aggregateId, payload, correlationId);
  }
}
