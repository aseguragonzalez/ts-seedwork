import { BaseBackgroundTask } from '@aseguragonzalez/ts-seedwork';

import { AccountOpened } from '../../domain/events/account-opened.js';
import { correlationContext } from '../correlation-context.js';

type SendWelcomeEmailPayload = {
  accountId: string;
  owner: string;
};

export class SendWelcomeEmailTask extends BaseBackgroundTask {
  static readonly TYPE = 'send-welcome-email';

  static create(event: AccountOpened): SendWelcomeEmailTask {
    const correlationId = correlationContext.getStore() ?? crypto.randomUUID();
    return new SendWelcomeEmailTask(
      { accountId: event.aggregateId, owner: event.payload.owner },
      correlationId,
      event.id
    );
  }

  private constructor(payload: SendWelcomeEmailPayload, correlationId: string, causationId: string) {
    super(SendWelcomeEmailTask.TYPE, payload, correlationId, causationId);
  }
}
