import { ValueObject } from '@aseguragonzalez/ts-seedwork';

import { InvalidBankAccountIdError } from './errors.js';

export class BankAccountId extends ValueObject {
  public constructor(public readonly value: string) {
    super();
    this.validate();
  }

  protected validate(): void {
    if (!this.value || this.value.trim() === '') {
      throw new InvalidBankAccountIdError();
    }
  }
}
