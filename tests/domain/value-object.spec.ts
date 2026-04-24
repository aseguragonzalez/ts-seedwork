import { ValueObject } from '@seedwork/domain/value-object';

describe('ValueObject (seedwork package)', () => {
  class TestValueObject extends ValueObject {
    constructor(
      public readonly prop1: string,

      public readonly prop2: number
    ) {
      super();
    }
  }

  it('should consider two value objects with same properties as equal', () => {
    const a = new TestValueObject('foo', 1);
    const b = new TestValueObject('foo', 1);

    expect(a.equals(b)).toBe(true);
  });

  it('should consider two value objects with different properties as not equal', () => {
    const a = new TestValueObject('foo', 1);
    const b = new TestValueObject('bar', 2);

    expect(a.equals(b)).toBe(false);
  });

  it('should return false if compared to non-value object', () => {
    const a = new TestValueObject('foo', 1);

    expect(a.equals({} as any)).toBe(false);
  });

  it('should return true if compared to itself', () => {
    const a = new TestValueObject('foo', 1);

    expect(a.equals(a)).toBe(true);
  });
});
