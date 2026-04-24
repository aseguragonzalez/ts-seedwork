import { DomainError } from './domain-error.js';

export class ValueError extends DomainError {
  public constructor(message: string) {
    super(message, 'VALUE_ERROR', 'ValueError');
  }
}
