import { BaseDomainEvent } from '@aseguragonzalez/ts-seedwork';

import { Money } from '../money.js';

type MoneyDepositedPayload = {
  accountId: string;
  amount: number;
  currency: string;
};

export class MoneyDeposited extends BaseDomainEvent<MoneyDepositedPayload> {
  static create(accountId: string, amount: Money): MoneyDeposited {
    return new MoneyDeposited(accountId, {
      accountId,
      amount: amount.amount,
      currency: amount.currency,
    });
  }

  private constructor(aggregateId: string, payload: MoneyDepositedPayload) {
    super(aggregateId, payload);
  }
}
