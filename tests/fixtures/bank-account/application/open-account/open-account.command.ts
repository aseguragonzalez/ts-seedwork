import { Command, ValidationErrors } from '@seedwork';

export class OpenAccountCommand implements Command {
  constructor(
    public readonly accountId: string,
    public readonly owner: string,
    public readonly initialAmount: number,
    public readonly currency: string
  ) {}

  validate(): void {
    const errors = [];
    if (!this.accountId) errors.push({ code: 'INVALID_ACCOUNT_ID', message: 'Account ID is required' });
    if (!this.owner) errors.push({ code: 'INVALID_OWNER', message: 'Owner is required' });
    if (this.initialAmount <= 0) errors.push({ code: 'INVALID_AMOUNT', message: 'Initial amount must be positive' });
    if (!this.currency) errors.push({ code: 'INVALID_CURRENCY', message: 'Currency is required' });
    if (errors.length > 0) throw new ValidationErrors(errors);
  }
}
