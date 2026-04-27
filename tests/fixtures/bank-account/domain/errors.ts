import { DomainError } from '@seedwork';

export class InvalidOwnerError extends DomainError {
  constructor() {
    super('Owner cannot be empty', 'INVALID_OWNER');
  }
}

export class InsufficientFundsError extends DomainError {
  constructor() {
    super('Insufficient funds', 'INSUFFICIENT_FUNDS');
  }
}

export class InvalidBankAccountIdError extends DomainError {
  constructor() {
    super('BankAccountId cannot be empty', 'INVALID_BANK_ACCOUNT_ID');
  }
}

export class InvalidAmountError extends DomainError {
  constructor(amount: number) {
    super(`Money amount cannot be negative: ${amount}`, 'INVALID_AMOUNT');
  }
}

export class InvalidCurrencyError extends DomainError {
  constructor() {
    super('Money currency cannot be empty', 'INVALID_CURRENCY');
  }
}

export class CurrencyMismatchError extends DomainError {
  constructor(a: string, b: string) {
    super(`Currency mismatch: ${a} vs ${b}`, 'CURRENCY_MISMATCH');
  }
}

export class AccountNotFoundError extends DomainError {
  constructor(accountId: string) {
    super(`Account ${accountId} not found`, 'NOT_FOUND');
  }
}
