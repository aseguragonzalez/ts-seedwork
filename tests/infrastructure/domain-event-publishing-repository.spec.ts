import { DomainEvent, DomainEventPublisher, DomainEventPublishingRepository, Repository } from '@seedwork';
import { AggregateRoot } from '@seedwork/domain/aggregate-root';
import { BaseDomainEvent } from '@seedwork/domain/domain-event';

class TestId {
  constructor(public readonly value: string) {}
}

class TestEvent extends BaseDomainEvent<{ id: string }> {
  static create(id: string): TestEvent {
    return new TestEvent(id, { id });
  }
  private constructor(id: string, payload: { id: string }) {
    super(id, payload);
  }
}

class TestAggregate extends AggregateRoot<TestId> {
  static create(id: TestId): TestAggregate {
    const event = TestEvent.create(id.value);
    return new TestAggregate(id).withEvent(event) as TestAggregate;
  }
  static empty(id: TestId): TestAggregate {
    return new TestAggregate(id);
  }
  private constructor(id: TestId, events: ReadonlyArray<DomainEvent> = []) {
    super(id, events);
  }
}

class InMemoryTestRepository implements Repository<TestId, TestAggregate> {
  private store = new Map<string, TestAggregate>();
  async findById(id: TestId): Promise<TestAggregate | null> {
    return this.store.get(id.value) ?? null;
  }
  async save(entity: TestAggregate): Promise<void> {
    this.store.set(entity.id.value, entity);
  }
  async deleteById(id: TestId): Promise<void> {
    this.store.delete(id.value);
  }
}

function makePublisher(): { publisher: DomainEventPublisher; captured: DomainEvent[] } {
  const captured: DomainEvent[] = [];
  const publisher: DomainEventPublisher = {
    publish: async events => {
      captured.push(...events);
    },
  };
  return { publisher, captured };
}

describe('DomainEventPublishingRepository', () => {
  it('delegates findById to the inner repository', async () => {
    const inner = new InMemoryTestRepository();
    const { publisher } = makePublisher();
    const repo = new DomainEventPublishingRepository(inner, publisher);
    const id = new TestId('1');
    const aggregate = TestAggregate.empty(id);
    await inner.save(aggregate);

    const result = await repo.findById(id);

    expect(result).toBe(aggregate);
  });

  it('delegates deleteById to the inner repository', async () => {
    const inner = new InMemoryTestRepository();
    const { publisher } = makePublisher();
    const repo = new DomainEventPublishingRepository(inner, publisher);
    const id = new TestId('1');
    await inner.save(TestAggregate.empty(id));

    await repo.deleteById(id);

    expect(await inner.findById(id)).toBeNull();
  });

  it('persists the aggregate before publishing events', async () => {
    const inner = new InMemoryTestRepository();
    const order: string[] = [];
    const publisher: DomainEventPublisher = {
      publish: async () => {
        order.push('publish');
      },
    };
    const originalSave = inner.save.bind(inner);
    inner.save = async e => {
      order.push('save');
      return originalSave(e);
    };
    const repo = new DomainEventPublishingRepository(inner, publisher);

    await repo.save(TestAggregate.create(new TestId('1')));

    expect(order).toEqual(['save', 'publish']);
  });

  it('publishes domain events raised by the aggregate on save', async () => {
    const inner = new InMemoryTestRepository();
    const { publisher, captured } = makePublisher();
    const repo = new DomainEventPublishingRepository(inner, publisher);
    const aggregate = TestAggregate.create(new TestId('1'));

    await repo.save(aggregate);

    expect(captured).toHaveLength(1);
    expect(captured[0]).toBeInstanceOf(TestEvent);
  });

  it('publishes nothing when the aggregate has no domain events', async () => {
    const inner = new InMemoryTestRepository();
    const { publisher, captured } = makePublisher();
    const repo = new DomainEventPublishingRepository(inner, publisher);

    await repo.save(TestAggregate.empty(new TestId('1')));

    expect(captured).toHaveLength(0);
  });

  it('does not publish events on deleteById', async () => {
    const inner = new InMemoryTestRepository();
    const { publisher, captured } = makePublisher();
    const repo = new DomainEventPublishingRepository(inner, publisher);
    const id = new TestId('1');
    await inner.save(TestAggregate.create(id));

    await repo.deleteById(id);

    expect(captured).toHaveLength(0);
  });
});
