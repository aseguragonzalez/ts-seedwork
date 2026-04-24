import { BaseDomainEvent } from '@seedwork';

import { Money } from '../money.js';

export class AccountOpened extends BaseDomainEvent {
  static create(accountId: string, owner: string, initialBalance: Money): AccountOpened {
    return new AccountOpened(
      crypto.randomUUID(),
      'AccountOpened',
      { accountId, owner, amount: initialBalance.amount, currency: initialBalance.currency },
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
