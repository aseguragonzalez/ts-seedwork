import { DomainEventHandler, IntegrationEventPublisher } from '@aseguragonzalez/ts-seedwork';

import { AccountOpened } from '../domain/events/account-opened.js';
import { AccountOpenedIntegrationEvent } from './account-opened.integration-event.js';

export class AccountOpenedDomainEventHandler implements DomainEventHandler<AccountOpened> {
  constructor(private readonly publisher: IntegrationEventPublisher) {}

  async handle(event: AccountOpened): Promise<void> {
    await this.publisher.publish([AccountOpenedIntegrationEvent.create(event)]);
  }
}
