import { DomainEventHandler, IntegrationEventPublisher } from '@aseguragonzalez/ts-seedwork';

import { AccountOpened } from '../domain/events/account-opened.js';
import { AccountOpenedIntegrationEvent } from './account-opened.integration-event.js';

export class AccountOpenedDomainEventHandler implements DomainEventHandler<AccountOpened> {
  constructor(private readonly publisher: IntegrationEventPublisher) {}

  async handle(event: AccountOpened): Promise<void> {
    const integrationEvent = new AccountOpenedIntegrationEvent(
      event.payload.accountId,
      {
        accountId: event.payload.accountId,
        owner: event.payload.owner,
        amount: event.payload.amount,
        currency: event.payload.currency,
      },
      event.id // use domain event id as correlationId
    );
    await this.publisher.publish([integrationEvent]);
  }
}
