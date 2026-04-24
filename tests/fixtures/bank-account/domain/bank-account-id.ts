import { ValueError } from '@seedwork';
import { TypedId } from '@seedwork';

export class BankAccountId extends TypedId {
  public constructor(value: string) {
    super(value);
  }

  protected validate(): void {
    if (!this.value || this.value.trim() === '') {
      throw new ValueError('BankAccountId cannot be empty');
    }
  }
}
