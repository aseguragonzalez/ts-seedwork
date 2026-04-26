import { AggregateRoot, DomainEvent } from '@seedwork';

import { BankAccountId } from './bank-account-id.js';
import { InsufficientFundsError, InvalidOwnerError } from './errors.js';
import { AccountOpened } from './events/account-opened.js';
import { MoneyDeposited } from './events/money-deposited.js';
import { MoneyWithdrawn } from './events/money-withdrawn.js';
import { Money } from './money.js';

export class BankAccount extends AggregateRoot<BankAccountId> {
  private constructor(
    id: BankAccountId,
    public readonly owner: string,
    public readonly balance: Money,
    events: ReadonlyArray<DomainEvent> = []
  ) {
    super(id, events);
  }

  static reconstitute(id: BankAccountId, owner: string, balance: Money): BankAccount {
    return new BankAccount(id, owner, balance);
  }

  static open(id: BankAccountId, owner: string, initialBalance: Money): BankAccount {
    if (!owner || owner.trim() === '') {
      throw new InvalidOwnerError();
    }
    const event = AccountOpened.create(id.value, owner, initialBalance);
    return new BankAccount(id, owner, initialBalance, [event]);
  }

  deposit(amount: Money): BankAccount {
    const event = MoneyDeposited.create(this.id.value, amount);
    return new BankAccount(this.id, this.owner, this.balance.add(amount), [...this.getDomainEvents(), event]);
  }

  withdraw(amount: Money): BankAccount {
    if (amount.isGreaterThan(this.balance)) {
      throw new InsufficientFundsError();
    }
    const event = MoneyWithdrawn.create(this.id.value, amount);
    return new BankAccount(this.id, this.owner, this.balance.subtract(amount), [...this.getDomainEvents(), event]);
  }
}
