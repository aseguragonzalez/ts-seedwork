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

  it('should return false when compared to a value object with fewer properties', () => {
    class Narrow extends ValueObject {
      constructor(public readonly prop1: string) {
        super();
      }
    }
    const a = new TestValueObject('foo', 1);
    const b = new Narrow('foo');

    expect(a.equals(b as any)).toBe(false);
  });

  it('toString returns a readable representation of all properties', () => {
    const a = new TestValueObject('hello', 42);

    expect(a.toString()).toBe('TestValueObject(prop1: hello, prop2: 42)');
  });
});
