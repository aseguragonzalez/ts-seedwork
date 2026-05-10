import { AggregateRoot } from '@src';
import { InMemoryRepository } from '@src/infrastructure/in-memory-repository';

class UserId {
  constructor(public readonly value: string) {
    this.value = value;
  }
  toString(): string {
    return this.value;
  }
}

class User extends AggregateRoot<UserId> {
  constructor(
    id: UserId,
    public readonly name: string
  ) {
    super(id);
  }
}

class UserRepository extends InMemoryRepository<UserId, User> {}

describe('InMemoryRepository', () => {
  it('findById returns null when entity does not exist', async () => {
    const repo = new UserRepository();
    const result = await repo.findById(new UserId('non-existent'));
    expect(result).toBeNull();
  });

  it('findById returns the entity after save', async () => {
    const repo = new UserRepository();
    const user = new User(new UserId('user-1'), 'Alice');
    await repo.save(user);

    const result = await repo.findById(new UserId('user-1'));
    expect(result).toBe(user);
  });

  it('save overwrites existing entity with same id', async () => {
    const repo = new UserRepository();
    const id = new UserId('user-1');
    const user1 = new User(id, 'Alice');
    const user2 = new User(id, 'Alice Updated');

    await repo.save(user1);
    await repo.save(user2);

    const result = await repo.findById(id);
    expect(result?.name).toBe('Alice Updated');
  });

  it('deleteById removes the entity', async () => {
    const repo = new UserRepository();
    const id = new UserId('user-1');
    await repo.save(new User(id, 'Alice'));

    await repo.deleteById(id);

    const result = await repo.findById(id);
    expect(result).toBeNull();
  });

  it('deleteById on non-existent id is a no-op', async () => {
    const repo = new UserRepository();
    await expect(repo.deleteById(new UserId('non-existent'))).resolves.toBeUndefined();
  });
});
