import { CommandHandler } from '@seedwork';

import { BankAccount } from '../../domain/bank-account.js';
import { BankAccountRepository } from '../../domain/bank-account.repository.js';
import { BankAccountId } from '../../domain/bank-account-id.js';
import { Money } from '../../domain/money.js';
import { OpenAccountCommand } from './open-account.command.js';

export class OpenAccountHandler implements CommandHandler<OpenAccountCommand> {
  constructor(private readonly repository: BankAccountRepository) {}

  async execute(command: OpenAccountCommand): Promise<void> {
    const id = new BankAccountId(command.accountId);
    const initialBalance = new Money(command.initialAmount, command.currency);
    const account = BankAccount.open(id, command.owner, initialBalance);
    await this.repository.save(account);
  }
}
