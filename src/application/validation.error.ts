export interface ValidationErrorDetail {
  code: string;
  message: string;
}

export class ValidationErrors extends Error {
  constructor(public readonly errors: ValidationErrorDetail[]) {
    super(errors.map(e => e.message).join('; '));
    this.name = 'ValidationErrors';
  }
}
