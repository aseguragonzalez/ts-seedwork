import { BaseIntegrationEvent } from '@aseguragonzalez/ts-seedwork';

export class AccountOpenedIntegrationEvent extends BaseIntegrationEvent {
  constructor(aggregateId: string, payload: Record<string, unknown>, correlationId: string, causationId?: string) {
    super('banking.bank_account.account_opened', '1.0', aggregateId, payload, correlationId, causationId);
  }
}
