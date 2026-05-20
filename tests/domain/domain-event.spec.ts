import { BaseDomainEvent } from '@src/domain/domain-event';

type TestPayload = { key: string };

class TestDomainEvent extends BaseDomainEvent<TestPayload> {
  constructor(aggregateId = 'agg-1') {
    super(aggregateId, { key: 'value' });
  }
}

describe('BaseDomainEvent (seedwork package)', () => {
  it('should hold all event properties', () => {
    const event = new TestDomainEvent('agg-1');
    expect(event.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(event.aggregateId).toBe('agg-1');
    expect(event.payload).toEqual({ key: 'value' });
    expect(event.occurredAt).toBeInstanceOf(Date);
  });

  it('should generate unique ids per instance', () => {
    const a = new TestDomainEvent();
    const b = new TestDomainEvent();
    expect(a.id).not.toBe(b.id);
  });
});
