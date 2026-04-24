import { CommandHandler, DomainError, DomainEventBus } from '@seedwork';

import { BankAccountRepository } from '../../domain/bank-account.repository.js';
import { BankAccountId } from '../../domain/bank-account-id.js';
import { Money } from '../../domain/money.js';
import { DepositMoneyCommand } from './deposit-money.command.js';

export class DepositMoneyHandler implements CommandHandler<DepositMoneyCommand> {
  constructor(
    private readonly repository: BankAccountRepository,
    private readonly eventBus: DomainEventBus
  ) {}

  async execute(command: DepositMoneyCommand): Promise<void> {
    const id = new BankAccountId(command.accountId);
    const account = await this.repository.getById(id);
    if (!account) {
      throw new DomainError(`Account ${command.accountId} not found`, 'NOT_FOUND');
    }
    const amount = new Money(command.amount, command.currency);
    const updated = account.deposit(amount);
    await this.eventBus.publish([...updated.getDomainEvents()]);
    await this.repository.save(updated);
  }
}
