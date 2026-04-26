import { BaseDomainEvent } from '@seedwork/domain/domain-event';

type TestPayload = { key: string };

class TestDomainEvent extends BaseDomainEvent<TestPayload> {
  constructor() {
    super('event-id', { key: 'value' });
  }
}

describe('BaseDomainEvent (seedwork package)', () => {
  it('should hold all event properties', () => {
    const event = new TestDomainEvent();
    expect(event.id).toBe('event-id');
    expect(event.payload).toEqual({ key: 'value' });
    expect(event.occurredAt).toBeInstanceOf(Date);
  });
});
