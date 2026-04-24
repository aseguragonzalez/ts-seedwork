import { DomainError, QueryHandler } from '@seedwork';

import { BankAccountRepository } from '../../domain/bank-account.repository.js';
import { BankAccountId } from '../../domain/bank-account-id.js';
import { GetBalanceQuery } from './get-balance.query.js';
import { GetBalanceResponse } from './get-balance.response.js';

export class GetBalanceHandler implements QueryHandler<GetBalanceQuery, GetBalanceResponse> {
  constructor(private readonly repository: BankAccountRepository) {}

  async execute(query: GetBalanceQuery): Promise<GetBalanceResponse> {
    const id = new BankAccountId(query.accountId);
    const account = await this.repository.getById(id);
    if (!account) {
      throw new DomainError(`Account ${query.accountId} not found`, 'NOT_FOUND');
    }
    return new GetBalanceResponse({
      accountId: account.id.value,
      owner: account.owner,
      amount: account.balance.amount,
      currency: account.balance.currency,
    });
  }
}
