import { BaseDomainEvent } from '@seedwork';

import { Money } from '../money.js';

export class MoneyDeposited extends BaseDomainEvent {
  static create(accountId: string, amount: Money): MoneyDeposited {
    return new MoneyDeposited(
      crypto.randomUUID(),
      'MoneyDeposited',
      { accountId, amount: amount.amount, currency: amount.currency },
      new Date(),
      '1.0.0'
    );
  }

  private constructor(
    id: string,
    eventName: string,
    payload: Record<string, unknown>,
    occurredAt: Date,
    version: string
  ) {
    super(id, eventName, payload as Record<string, any>, occurredAt, version);
  }
}
