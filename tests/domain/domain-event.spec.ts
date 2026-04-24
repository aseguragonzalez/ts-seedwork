import { BaseDomainEvent } from '@seedwork/domain/domain-event';

class TestDomainEvent extends BaseDomainEvent {
  constructor() {
    super('event-id', 'TestAggregate/TestEvent', { key: 'value' }, new Date('2024-01-01'), '1.0.0');
  }
}

describe('BaseDomainEvent (seedwork package)', () => {
  it('should hold all event properties', () => {
    const event = new TestDomainEvent();
    expect(event.id).toBe('event-id');
    expect(event.eventName).toBe('TestAggregate/TestEvent');
    expect(event.payload).toEqual({ key: 'value' });
    expect(event.version).toBe('1.0.0');
    expect(event.occurredAt).toBeInstanceOf(Date);
  });
});
