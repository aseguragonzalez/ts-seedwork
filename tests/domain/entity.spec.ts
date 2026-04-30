import { Entity } from '@seedwork/domain/entity';
import { ValueObject } from '@seedwork/domain/value-object';

describe('Entity (seedwork package)', () => {
  class TestEntity extends Entity<string> {
    constructor(
      id: string,
      public readonly name: string
    ) {
      super(id);
    }
  }

  class NumericEntity extends Entity<number> {
    constructor(id: number) {
      super(id);
    }
  }

  it('throws if id is undefined', () => {
    // @ts-expect-error
    expect(() => new TestEntity(undefined, 'foo')).toThrow('TestEntity requires an id');
  });

  it('throws if id is null', () => {
    // @ts-expect-error
    expect(() => new TestEntity(null, 'foo')).toThrow('TestEntity requires an id');
  });

  it('accepts 0 as a valid numeric id', () => {
    const entity = new NumericEntity(0);
    expect(entity.id).toBe(0);
  });

  it('should assign id and properties', () => {
    const entity = new TestEntity('id-1', 'foo');

    expect(entity.id).toBe('id-1');
    expect(entity.name).toBe('foo');
  });

  it('should compare equality by id', () => {
    const a = new TestEntity('id-1', 'foo');
    const b = new TestEntity('id-1', 'bar');
    const c = new TestEntity('id-2', 'foo');

    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });

  it('should return false if compared to non-entity', () => {
    const a = new TestEntity('id-1', 'foo');

    expect(a.equals({} as any)).toBe(false);
  });

  it('should return false if compared to a different entity type with the same id', () => {
    class OtherEntity extends Entity<string> {
      constructor(id: string) {
        super(id);
      }
    }
    const a = new TestEntity('id-1', 'foo');
    const b = new OtherEntity('id-1');

    expect(a.equals(b)).toBe(false);
  });

  it('should return true if compared to itself', () => {
    const a = new TestEntity('id-1', 'foo');

    expect(a.equals(a)).toBe(true);
  });

  describe('with ValueObject-based id', () => {
    class AccountId extends ValueObject {
      constructor(public readonly value: string) {
        super();
      }
    }

    class AccountEntity extends Entity<AccountId> {
      constructor(id: AccountId) {
        super(id);
      }
    }

    it('uses ValueObject.equals when id has an equals method', () => {
      const a = new AccountEntity(new AccountId('id-1'));
      const b = new AccountEntity(new AccountId('id-1'));
      const c = new AccountEntity(new AccountId('id-2'));

      expect(a.equals(b)).toBe(true);
      expect(a.equals(c)).toBe(false);
    });
  });
});
