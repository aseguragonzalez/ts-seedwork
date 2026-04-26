import { BaseDomainEvent } from '@seedwork';

import { Money } from '../money.js';

type MoneyWithdrawnPayload = {
  accountId: string;
  amount: number;
  currency: string;
};

export class MoneyWithdrawn extends BaseDomainEvent<MoneyWithdrawnPayload> {
  static create(accountId: string, amount: Money): MoneyWithdrawn {
    return new MoneyWithdrawn(crypto.randomUUID(), {
      accountId,
      amount: amount.amount,
      currency: amount.currency,
    });
  }

  private constructor(id: string, payload: MoneyWithdrawnPayload) {
    super(id, payload);
  }
}
