import { DomainError } from '@seedwork/domain/errors/domain-error';
import { ValueError } from '@seedwork/domain/errors/value.error';

describe('ValueError (seedwork package)', () => {
  it('should extend DomainError', () => {
    const error = new ValueError('Invalid value');
    expect(error).toBeInstanceOf(DomainError);
  });

  it('should carry the correct code and name', () => {
    const error = new ValueError('Invalid amount');
    expect(error.message).toBe('Invalid amount');
    expect(error.code).toBe('VALUE_ERROR');
    expect(error.name).toBe('ValueError');
  });
});
