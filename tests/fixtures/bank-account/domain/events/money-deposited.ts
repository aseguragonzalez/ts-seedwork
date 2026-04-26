import { BaseDomainEvent } from '@seedwork';

import { Money } from '../money.js';

type MoneyDepositedPayload = {
  accountId: string;
  amount: number;
  currency: string;
};

export class MoneyDeposited extends BaseDomainEvent<MoneyDepositedPayload> {
  static create(accountId: string, amount: Money): MoneyDeposited {
    return new MoneyDeposited(crypto.randomUUID(), {
      accountId,
      amount: amount.amount,
      currency: amount.currency,
    });
  }

  private constructor(id: string, payload: MoneyDepositedPayload) {
    super(id, payload);
  }
}
