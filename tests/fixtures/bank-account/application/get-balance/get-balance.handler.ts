import { Maybe, QueryHandler } from '@seedwork';

import { BankAccountRepository } from '../../domain/bank-account.repository.js';
import { BankAccountId } from '../../domain/bank-account-id.js';
import { GetBalanceQuery } from './get-balance.query.js';
import { BalanceData } from './get-balance.response.js';

export class GetBalanceHandler implements QueryHandler<GetBalanceQuery, BalanceData> {
  constructor(private readonly repository: BankAccountRepository) {}

  async execute(query: GetBalanceQuery): Promise<Maybe<BalanceData>> {
    const id = new BankAccountId(query.accountId);
    const account = await this.repository.getById(id);
    if (!account) return Maybe.nothing();
    return Maybe.just({
      accountId: account.id.value,
      owner: account.owner,
      amount: account.balance.amount,
      currency: account.balance.currency,
    });
  }
}
