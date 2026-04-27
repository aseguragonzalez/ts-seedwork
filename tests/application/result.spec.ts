import { Result } from '@seedwork';

describe('Result.ok()', () => {
  it('constructs an ok result', () => {
    const result = Result.ok();
    expect(result).toBeInstanceOf(Result);
    expect(result.isOk()).toBe(true);
    expect(result.isFail()).toBe(false);
    expect(result.errors).toHaveLength(0);
  });

  it('is immutable', () => {
    const result = Result.ok();
    expect(() => {
      (result as any).errors = [];
    }).toThrow();
  });
});

describe('Result.fail()', () => {
  it('constructs a fail result with the given errors', () => {
    const result = Result.fail([{ code: 'NOT_FOUND', description: 'Resource not found' }]);
    expect(result).toBeInstanceOf(Result);
    expect(result.isOk()).toBe(false);
    expect(result.isFail()).toBe(true);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe('NOT_FOUND');
    expect(result.errors[0].description).toBe('Resource not found');
  });

  it('errors array is immutable', () => {
    const result = Result.fail([{ code: 'ERR', description: 'error' }]);
    expect(() => {
      (result.errors as any).push({ code: 'X', description: 'x' });
    }).toThrow();
  });

  it('supports multiple errors', () => {
    const result = Result.fail([
      { code: 'ERR_A', description: 'First error' },
      { code: 'ERR_B', description: 'Second error' },
    ]);
    expect(result.errors).toHaveLength(2);
  });
});
