import { BankAccount } from '../domain/bank-account.js';
import { BankAccountRepository } from '../domain/bank-account.repository.js';
import { BankAccountId } from '../domain/bank-account-id.js';

export class InMemoryBankAccountRepository implements BankAccountRepository {
  private readonly store = new Map<string, BankAccount>();

  async getById(id: BankAccountId): Promise<BankAccount | null> {
    return this.store.get(id.value) ?? null;
  }

  async save(account: BankAccount): Promise<void> {
    this.store.set(account.id.value, account);
  }

  async delete(id: BankAccountId): Promise<void> {
    this.store.delete(id.value);
  }
}
