import { ValueError, ValueObject } from '@seedwork';

export class BankAccountId extends ValueObject {
  public constructor(public readonly value: string) {
    super();
    if (!value || value.trim() === '') {
      throw new ValueError('BankAccountId cannot be empty');
    }
  }
}
