import { Entity } from '@seedwork/domain/entity';

describe('Entity (seedwork package)', () => {
  class TestEntity extends Entity<string> {
    constructor(
      id: string,

      public readonly name: string
    ) {
      super(id);
    }
  }

  it('should throw if id is missing', () => {
    // @ts-expect-error
    expect(() => new TestEntity(undefined, 'foo')).toThrow('TestEntity requires an id');
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

  it('should return true if compared to itself', () => {
    const a = new TestEntity('id-1', 'foo');

    expect(a.equals(a)).toBe(true);
  });
});
