import { AggregateRoot } from '@src/domain/aggregate-root';
import { BaseDomainEvent, TypedDomainEvent } from '@src/domain/domain-event';

class TestEvent extends BaseDomainEvent<{ value: string }> {
  constructor(aggregateId: string, value: string) {
    super(aggregateId, { value });
  }
}

class TestAggregate extends AggregateRoot<string> {
  constructor(id: string, events: ReadonlyArray<TypedDomainEvent<Record<string, unknown>>> = []) {
    super(id, events);
    this.validate();
  }

  protected validate(): void {}

  trigger(value: string): TestAggregate {
    return new TestAggregate(this.id, [...this.getDomainEvents(), new TestEvent(this.id, value)]);
  }
}

describe('AggregateRoot', () => {
  it('getDomainEvents returns accumulated events', () => {
    const agg = new TestAggregate('id-1').trigger('foo').trigger('bar');
    expect(agg.getDomainEvents()).toHaveLength(2);
  });

  it('getDomainEvents is non-destructive — calling twice returns the same events', () => {
    const agg = new TestAggregate('id-1').trigger('foo');
    expect(agg.getDomainEvents()).toHaveLength(1);
    expect(agg.getDomainEvents()).toHaveLength(1);
  });

  it('getDomainEvents returns a copy — external mutations do not affect internal state', () => {
    const agg = new TestAggregate('id-1').trigger('foo');
    (agg.getDomainEvents() as TypedDomainEvent<Record<string, unknown>>[]).push(new TestEvent('id-1', 'injected'));
    expect(agg.getDomainEvents()).toHaveLength(1);
  });

  it('behavior methods return a new instance, not the same reference', () => {
    const original = new TestAggregate('id-1');
    const updated = original.trigger('foo');
    expect(original).not.toBe(updated);
  });

  it('original instance is unaffected after behavior call', () => {
    const original = new TestAggregate('id-1');
    original.trigger('foo');
    expect(original.getDomainEvents()).toHaveLength(0);
  });
});
