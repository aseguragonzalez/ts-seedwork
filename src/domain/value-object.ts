export abstract class ValueObject {
  protected constructor() {}

  public equals(other: ValueObject): boolean {
    if (!(other instanceof ValueObject)) {
      return false;
    }

    if (this === other) {
      return true;
    }

    if (this.constructor !== other.constructor) {
      return false;
    }

    const thisProps = Object.getOwnPropertyNames(this);
    const otherProps = Object.getOwnPropertyNames(other);
    if (thisProps.length !== otherProps.length) {
      return false;
    }

    for (const prop of thisProps) {
      const thisVal = (this as any)[prop];
      const otherVal = (other as any)[prop];
      if (thisVal instanceof ValueObject) {
        if (!thisVal.equals(otherVal)) return false;
      } else if (thisVal instanceof Date) {
        if (!(otherVal instanceof Date) || thisVal.getTime() !== otherVal.getTime()) return false;
      } else if (Array.isArray(thisVal)) {
        if (!Array.isArray(otherVal) || thisVal.length !== otherVal.length) return false;
        if (!thisVal.every((v, i) => (v instanceof ValueObject ? v.equals(otherVal[i]) : v === otherVal[i])))
          return false;
      } else if (thisVal !== otherVal) {
        return false;
      }
    }
    return true;
  }

  public toString(): string {
    const props = Object.getOwnPropertyNames(this)
      .map(prop => `${prop}: ${(this as any)[prop]}`)
      .join(', ');
    return `${this.constructor.name}(${props})`;
  }
}
