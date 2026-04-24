export abstract class Entity<ID> {
  protected constructor(public readonly id: ID) {
    if (!id) {
      throw new Error(`${this.constructor.name} requires an id`);
    }
  }

  public equals(other: Entity<ID>): boolean {
    if (!(other instanceof Entity)) {
      return false;
    }

    if (this === other) {
      return true;
    }

    const thisId = this.id as unknown;
    if (thisId !== null && thisId !== undefined && typeof (thisId as any).equals === 'function') {
      return (thisId as any).equals(other.id);
    }

    return this.id === other.id;
  }
}
