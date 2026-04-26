import { BankAccount } from '../domain/bank-account.js';
import { BankAccountId } from '../domain/bank-account-id.js';
import {
  CurrencyMismatchError,
  InsufficientFundsError,
  InvalidAmountError,
  InvalidCurrencyError,
  InvalidOwnerError,
} from '../domain/errors.js';
import { AccountOpened } from '../domain/events/account-opened.js';
import { MoneyDeposited } from '../domain/events/money-deposited.js';
import { MoneyWithdrawn } from '../domain/events/money-withdrawn.js';
import { Money } from '../domain/money.js';

const id = new BankAccountId('acc-1');
const eur = (amount: number) => new Money(amount, 'EUR');

describe('BankAccount', () => {
  describe('open', () => {
    it('creates an account with the correct initial state', () => {
      const account = BankAccount.open(id, 'Alice', eur(100));
      expect(account.id).toBe(id);
      expect(account.owner).toBe('Alice');
      expect(account.balance).toEqual(eur(100));
    });

    it('emits an AccountOpened event', () => {
      const account = BankAccount.open(id, 'Alice', eur(100));
      const events = account.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(AccountOpened);
      expect((events[0] as AccountOpened).payload).toMatchObject({ accountId: 'acc-1', owner: 'Alice', amount: 100 });
    });

    it('throws InvalidOwnerError when owner is empty', () => {
      expect(() => BankAccount.open(id, '', eur(100))).toThrow(InvalidOwnerError);
    });

    it('throws InvalidAmountError when initial balance is negative', () => {
      expect(() => BankAccount.open(id, 'Alice', eur(-1))).toThrow(InvalidAmountError);
    });
  });

  describe('deposit', () => {
    it('returns a new instance — original is unchanged', () => {
      const original = BankAccount.open(id, 'Alice', eur(100));
      const updated = original.deposit(eur(50));
      expect(updated).not.toBe(original);
      expect(original.balance).toEqual(eur(100));
    });

    it('increases the balance by the deposited amount', () => {
      const account = BankAccount.open(id, 'Alice', eur(100)).deposit(eur(50));
      expect(account.balance).toEqual(eur(150));
    });

    it('emits a MoneyDeposited event', () => {
      const account = BankAccount.open(id, 'Alice', eur(100)).deposit(eur(50));
      const events = account.getDomainEvents();
      expect(events).toHaveLength(2);
      expect(events[1]).toBeInstanceOf(MoneyDeposited);
      expect((events[1] as MoneyDeposited).payload).toMatchObject({ accountId: 'acc-1', amount: 50 });
    });

    it('accumulates events across multiple operations', () => {
      const account = BankAccount.open(id, 'Alice', eur(100)).deposit(eur(50)).deposit(eur(25));
      expect(account.getDomainEvents()).toHaveLength(3);
      expect(account.balance).toEqual(eur(175));
    });
  });

  describe('withdraw', () => {
    it('returns a new instance — original is unchanged', () => {
      const original = BankAccount.open(id, 'Alice', eur(100));
      const updated = original.withdraw(eur(30));
      expect(updated).not.toBe(original);
      expect(original.balance).toEqual(eur(100));
    });

    it('decreases the balance by the withdrawn amount', () => {
      const account = BankAccount.open(id, 'Alice', eur(100)).withdraw(eur(30));
      expect(account.balance).toEqual(eur(70));
    });

    it('emits a MoneyWithdrawn event', () => {
      const account = BankAccount.open(id, 'Alice', eur(100)).withdraw(eur(30));
      const events = account.getDomainEvents();
      expect(events).toHaveLength(2);
      expect(events[1]).toBeInstanceOf(MoneyWithdrawn);
      expect((events[1] as MoneyWithdrawn).payload).toMatchObject({ accountId: 'acc-1', amount: 30 });
    });

    it('throws InsufficientFundsError when amount exceeds balance', () => {
      const account = BankAccount.open(id, 'Alice', eur(100));
      expect(() => account.withdraw(eur(200))).toThrow(InsufficientFundsError);
    });

    it('allows withdrawing the full balance', () => {
      const account = BankAccount.open(id, 'Alice', eur(100)).withdraw(eur(100));
      expect(account.balance).toEqual(eur(0));
    });
  });

  describe('Money', () => {
    it('throws InvalidAmountError when amount is negative', () => {
      expect(() => new Money(-1, 'EUR')).toThrow(InvalidAmountError);
    });

    it('throws InvalidCurrencyError when currency is empty', () => {
      expect(() => new Money(100, '')).toThrow(InvalidCurrencyError);
    });

    it('throws CurrencyMismatchError on currency mismatch', () => {
      expect(() => eur(100).add(new Money(50, 'USD'))).toThrow(CurrencyMismatchError);
    });

    it('compares equal by value', () => {
      expect(eur(100).equals(eur(100))).toBe(true);
      expect(eur(100).equals(eur(200))).toBe(false);
    });
  });
});
