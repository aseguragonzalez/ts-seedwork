import { BaseDomainEvent } from '@aseguragonzalez/ts-seedwork';

import { Money } from '../money.js';

type MoneyWithdrawnPayload = {
  accountId: string;
  amount: number;
  currency: string;
};

export class MoneyWithdrawn extends BaseDomainEvent<MoneyWithdrawnPayload> {
  static create(accountId: string, amount: Money): MoneyWithdrawn {
    return new MoneyWithdrawn(accountId, {
      accountId,
      amount: amount.amount,
      currency: amount.currency,
    });
  }

  private constructor(aggregateId: string, payload: MoneyWithdrawnPayload) {
    super(aggregateId, payload);
  }
}
