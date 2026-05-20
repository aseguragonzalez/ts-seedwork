import { DomainEventHandler, IntegrationEventPublisher, TaskScheduler } from '@aseguragonzalez/ts-seedwork';

import { AccountOpened } from '../domain/events/account-opened.js';
import { AccountOpenedIntegrationEvent } from './account-opened.integration-event.js';
import { SendWelcomeEmailTask } from './send-welcome-email/send-welcome-email.task.js';

export class AccountOpenedDomainEventHandler implements DomainEventHandler<AccountOpened> {
  constructor(
    private readonly publisher: IntegrationEventPublisher,
    private readonly taskScheduler: TaskScheduler
  ) {}

  async handle(event: AccountOpened): Promise<void> {
    await this.publisher.publish([AccountOpenedIntegrationEvent.create(event)]);
    await this.taskScheduler.schedule(SendWelcomeEmailTask.create(event));
  }
}
