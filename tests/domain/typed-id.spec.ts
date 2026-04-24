import { ValueError } from '@seedwork/domain/errors/value.error';
import { TypedId } from '@seedwork/domain/typed-id';

class SampleId extends TypedId {
  public constructor(value: string) {
    super(value);
  }

  protected validate(): void {
    if (!this.value || this.value.trim() === '') {
      throw new ValueError('SampleId value cannot be empty');
    }
  }
}

class OtherId extends TypedId {
  public constructor(value: string) {
    super(value);
  }

  protected validate(): void {}
}

describe('TypedId (seedwork package)', () => {
  it('should expose value as string', () => {
    const id = new SampleId('abc-123');
    expect(id.value).toBe('abc-123');
    expect(id.toString()).toBe('abc-123');
  });

  it('should throw if validate fails', () => {
    expect(() => new SampleId('')).toThrow(ValueError);
  });

  it('should be equal when same subclass and same value', () => {
    expect(new SampleId('x').equals(new SampleId('x'))).toBe(true);
  });

  it('should not be equal when same value but different subclass', () => {
    expect(new SampleId('x').equals(new OtherId('x'))).toBe(false);
  });

  it('should not be equal when different values', () => {
    expect(new SampleId('x').equals(new SampleId('y'))).toBe(false);
  });

  it('should not be equal to non-TypedId', () => {
    expect(new SampleId('x').equals({} as any)).toBe(false);
  });
});
