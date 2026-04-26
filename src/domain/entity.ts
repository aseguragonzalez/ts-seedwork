export abstract class Entity<TId> {
  protected constructor(public readonly id: TId) {
    if (!id) {
      throw new Error(`${this.constructor.name} requires an id`);
    }
  }

  public equals(other: Entity<TId>): boolean {
    if (!(other instanceof Entity)) {
      return false;
    }

    if (this === other) {
      return true;
    }

    if (this.constructor !== other.constructor) {
      return false;
    }

    const thisId = this.id as unknown;
    if (thisId !== null && thisId !== undefined && typeof (thisId as any).equals === 'function') {
      return (thisId as any).equals(other.id);
    }

    return this.id === other.id;
  }
}
