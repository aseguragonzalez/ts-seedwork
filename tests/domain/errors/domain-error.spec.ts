import { DomainError } from '@seedwork/domain/errors/domain-error';

describe('DomainError (seedwork package)', () => {
  class TestDomainError extends DomainError {
    constructor(message: string) {
      super(message, 'TEST_CODE', 'TestDomainError');
    }
  }

  it('should set message, code, and name', () => {
    const err = new TestDomainError('fail');
    expect(err.message).toBe('fail');
    expect(err.code).toBe('TEST_CODE');
    expect(err.name).toBe('TestDomainError');
  });
});
