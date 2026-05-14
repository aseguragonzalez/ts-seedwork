import { CommandHandler } from '@aseguragonzalez/ts-seedwork';

import { BankAccountRepository } from '../../domain/bank-account.repository.js';
import { BankAccountId } from '../../domain/bank-account-id.js';
import { AccountNotFoundError } from '../../domain/errors.js';
import { Money } from '../../domain/money.js';
import { WithdrawMoneyCommand } from './withdraw-money.command.js';

export class WithdrawMoneyHandler implements CommandHandler<WithdrawMoneyCommand> {
  constructor(private readonly repository: BankAccountRepository) {}

  async handle(command: WithdrawMoneyCommand): Promise<void> {
    const id = new BankAccountId(command.accountId);
    const account = await this.repository.findById(id);
    if (!account) {
      throw new AccountNotFoundError(command.accountId);
    }
    const amount = new Money(command.amount, command.currency);
    const updated = account.withdraw(amount);
    await this.repository.save(updated);
  }
}
