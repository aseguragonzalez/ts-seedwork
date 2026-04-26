import { ApplicationRequest, ValidationErrors } from '@seedwork';

export class OpenAccountRequest implements ApplicationRequest {
  constructor(
    public readonly owner: string,
    public readonly initialAmount: number,
    public readonly currency: string
  ) {}

  validate(): void {
    const errors = [];
    if (!this.owner) errors.push({ code: 'REQUIRED_OWNER', message: 'Owner is required' });
    if (this.initialAmount < 0) errors.push({ code: 'INVALID_AMOUNT', message: 'Initial amount must be non-negative' });
    if (!this.currency) errors.push({ code: 'REQUIRED_CURRENCY', message: 'Currency is required' });
    if (errors.length > 0) throw new ValidationErrors(errors);
  }
}
