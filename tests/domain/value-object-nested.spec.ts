import { ValueObject } from '@seedwork/domain/value-object';

class Money extends ValueObject {
  constructor(
    public readonly amount: number,

    public readonly currency: string
  ) {
    super();
  }
}

class Price extends ValueObject {
  constructor(
    public readonly net: Money,

    public readonly vat: Money
  ) {
    super();
  }
}

class DateRange extends ValueObject {
  constructor(
    public readonly from: Date,

    public readonly to: Date
  ) {
    super();
  }
}

class TagList extends ValueObject {
  constructor(public readonly tags: string[]) {
    super();
  }
}

describe('ValueObject — nested equality (seedwork package)', () => {
  it('should be equal when nested VOs are equal', () => {
    const a = new Price(new Money(100, 'EUR'), new Money(21, 'EUR'));
    const b = new Price(new Money(100, 'EUR'), new Money(21, 'EUR'));
    expect(a.equals(b)).toBe(true);
  });

  it('should not be equal when nested VO differs', () => {
    const a = new Price(new Money(100, 'EUR'), new Money(21, 'EUR'));
    const b = new Price(new Money(100, 'EUR'), new Money(10, 'EUR'));
    expect(a.equals(b)).toBe(false);
  });

  it('should be equal when Date properties represent the same instant', () => {
    const a = new DateRange(new Date('2024-01-01'), new Date('2024-12-31'));
    const b = new DateRange(new Date('2024-01-01'), new Date('2024-12-31'));
    expect(a.equals(b)).toBe(true);
  });

  it('should not be equal when Date properties differ', () => {
    const a = new DateRange(new Date('2024-01-01'), new Date('2024-12-31'));
    const b = new DateRange(new Date('2024-01-01'), new Date('2025-12-31'));
    expect(a.equals(b)).toBe(false);
  });

  it('should be equal when primitive array properties are equal', () => {
    const a = new TagList(['a', 'b', 'c']);
    const b = new TagList(['a', 'b', 'c']);
    expect(a.equals(b)).toBe(true);
  });

  it('should not be equal when primitive array properties differ in content', () => {
    const a = new TagList(['a', 'b']);
    const b = new TagList(['a', 'x']);
    expect(a.equals(b)).toBe(false);
  });

  it('should not be equal when primitive array properties differ in length', () => {
    const a = new TagList(['a', 'b']);
    const b = new TagList(['a']);
    expect(a.equals(b)).toBe(false);
  });
});
