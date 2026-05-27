import { Command, ValidationErrorDetail, ValidationErrors } from '@aseguragonzalez/ts-seedwork';

export class DepositMoneyCommand extends Command {
  constructor(
    public readonly accountId: string,
    public readonly amount: number,
    public readonly currency: string
  ) {
    super();
    this.validate();
  }

  protected validate(): void {
    const errors: ValidationErrorDetail[] = [];
    if (!this.accountId) {
      errors.push({ code: 'INVALID_ACCOUNT_ID', message: 'Account ID is required' });
    }
    if (this.amount <= 0) {
      errors.push({ code: 'INVALID_AMOUNT', message: 'Amount must be positive' });
    }
    if (!this.currency) {
      errors.push({ code: 'INVALID_CURRENCY', message: 'Currency is required' });
    }
    if (errors.length > 0) {
      throw new ValidationErrors(errors);
    }
  }
}
