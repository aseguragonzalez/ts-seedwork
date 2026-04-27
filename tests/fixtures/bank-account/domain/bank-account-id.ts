import { ValueObject } from '@seedwork';

import { InvalidBankAccountIdError } from './errors.js';

export class BankAccountId extends ValueObject {
  public constructor(public readonly value: string) {
    super();
    if (!value || value.trim() === '') {
      throw new InvalidBankAccountIdError();
    }
  }
}
