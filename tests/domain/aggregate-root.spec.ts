import { AggregateRoot } from '@seedwork/domain/aggregate-root';
import { BaseDomainEvent, DomainEvent } from '@seedwork/domain/domain-event';

class TestEvent extends BaseDomainEvent<{ value: string }> {
  constructor(value: string) {
    super({ value });
  }
}

class TestAggregate extends AggregateRoot<string> {
  constructor(id: string, events: ReadonlyArray<DomainEvent> = []) {
    super(id, events);
  }

  trigger(value: string): TestAggregate {
    return new TestAggregate(this.id, [...this.getDomainEvents(), new TestEvent(value)]);
  }

  triggerViaHelper(value: string): this {
    return this.withEvent(new TestEvent(value));
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
    (agg.getDomainEvents() as DomainEvent[]).push(new TestEvent('injected'));
    expect(agg.getDomainEvents()).toHaveLength(1);
  });

  it('withEvent returns a new instance, not the same reference', () => {
    const original = new TestAggregate('id-1');
    const updated = original.triggerViaHelper('foo');
    expect(original).not.toBe(updated);
  });

  it('original instance is unaffected after withEvent', () => {
    const original = new TestAggregate('id-1');
    original.triggerViaHelper('foo');
    expect(original.getDomainEvents()).toHaveLength(0);
  });

  it('withEvent clone preserves subclass identity', () => {
    const agg = new TestAggregate('id-1').triggerViaHelper('foo');
    expect(agg).toBeInstanceOf(TestAggregate);
    expect(agg).toBeInstanceOf(AggregateRoot);
  });

  it('withEvent clone preserves aggregate id', () => {
    const agg = new TestAggregate('id-42').triggerViaHelper('foo');
    expect(agg.id).toBe('id-42');
  });

  it('withEvent accumulates events across multiple calls', () => {
    const agg = new TestAggregate('id-1').triggerViaHelper('a').triggerViaHelper('b').triggerViaHelper('c');
    expect(agg.getDomainEvents()).toHaveLength(3);
  });
});
