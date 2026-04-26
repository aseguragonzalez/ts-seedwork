import { Maybe } from '@seedwork/application/queries';

describe('Maybe.just()', () => {
  it('constructs a present value', () => {
    const result = Maybe.just(42);
    expect(result).toBeInstanceOf(Maybe);
    expect(result.value).toBe(42);
  });

  it('isJust returns true and isNothing returns false', () => {
    const result = Maybe.just('hello');
    expect(result.isJust()).toBe(true);
    expect(result.isNothing()).toBe(false);
  });
});

describe('Maybe.nothing()', () => {
  it('constructs an absent value', () => {
    const result = Maybe.nothing();
    expect(result).toBeInstanceOf(Maybe);
    expect(result.value).toBeUndefined();
  });

  it('isJust returns false and isNothing returns true', () => {
    const result = Maybe.nothing();
    expect(result.isJust()).toBe(false);
    expect(result.isNothing()).toBe(true);
  });
});

describe('type narrowing', () => {
  it('narrows value to T inside isJust() branch', () => {
    const result = Maybe.just(7);
    if (result.isJust()) {
      const val: number = result.value;
      expect(val).toBe(7);
    }
  });

  it('value is undefined outside isJust() branch', () => {
    const result: Maybe<number> = Maybe.nothing();
    expect(result.value).toBeUndefined();
  });
});
