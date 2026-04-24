export abstract class TypedId {
  protected constructor(public readonly value: string) {
    this.validate();
  }

  protected abstract validate(): void;

  public equals(other: TypedId): boolean {
    if (!(other instanceof TypedId)) {
      return false;
    }
    return this.constructor === other.constructor && this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
