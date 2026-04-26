import crypto from 'node:crypto';

import { ApplicationService } from '@seedwork';

import { BankAccount } from '../../domain/bank-account.js';
import { BankAccountRepository } from '../../domain/bank-account.repository.js';
import { BankAccountId } from '../../domain/bank-account-id.js';
import { Money } from '../../domain/money.js';
import { OpenAccountRequest } from './open-account.request.js';
import { OpenAccountResponse } from './open-account.response.js';

export class OpenAccountService implements ApplicationService<OpenAccountRequest, OpenAccountResponse> {
  constructor(private readonly repository: BankAccountRepository) {}

  async execute(request: OpenAccountRequest): Promise<OpenAccountResponse> {
    request.validate();
    const id = new BankAccountId(crypto.randomUUID());
    const initialBalance = new Money(request.initialAmount, request.currency);
    const account = BankAccount.open(id, request.owner, initialBalance);
    await this.repository.save(account);
    return { accountId: id.value };
  }
}
