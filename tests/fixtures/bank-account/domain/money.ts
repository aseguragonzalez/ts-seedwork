import { DomainError, ValueError, ValueObject } from '@seedwork';

export class Money extends ValueObject {
  constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {
    super();
    if (amount < 0) throw new ValueError(`Money amount cannot be negative: ${amount}`);
    if (!currency || currency.trim() === '') throw new ValueError('Money currency cannot be empty');
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }

  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount > other.amount;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new DomainError(`Currency mismatch: ${this.currency} vs ${other.currency}`, 'CURRENCY_MISMATCH');
    }
  }
}
