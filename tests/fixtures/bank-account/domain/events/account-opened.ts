import { BaseDomainEvent } from '@seedwork';

import { Money } from '../money.js';

type AccountOpenedPayload = {
  accountId: string;
  owner: string;
  amount: number;
  currency: string;
};

export class AccountOpened extends BaseDomainEvent<AccountOpenedPayload> {
  static create(accountId: string, owner: string, initialBalance: Money): AccountOpened {
    return new AccountOpened(crypto.randomUUID(), {
      accountId,
      owner,
      amount: initialBalance.amount,
      currency: initialBalance.currency,
    });
  }

  private constructor(id: string, payload: AccountOpenedPayload) {
    super(id, payload);
  }
}
