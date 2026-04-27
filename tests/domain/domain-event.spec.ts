import { BaseDomainEvent } from '@seedwork/domain/domain-event';

type TestPayload = { key: string };

class TestDomainEvent extends BaseDomainEvent<TestPayload> {
  constructor() {
    super({ key: 'value' });
  }
}

describe('BaseDomainEvent (seedwork package)', () => {
  it('should hold all event properties', () => {
    const event = new TestDomainEvent();
    expect(event.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(event.payload).toEqual({ key: 'value' });
    expect(event.occurredAt).toBeInstanceOf(Date);
  });

  it('should generate unique ids per instance', () => {
    const a = new TestDomainEvent();
    const b = new TestDomainEvent();
    expect(a.id).not.toBe(b.id);
  });
});
