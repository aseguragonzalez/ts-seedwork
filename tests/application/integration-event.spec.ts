import { BaseIntegrationEvent } from '@src/application/integration-event';

type TestPayload = { key: string };

class TestIntegrationEvent extends BaseIntegrationEvent<TestPayload> {
  constructor(
    aggregateId = 'agg-1',
    correlationId = 'corr-1',
    causationId?: string,
    metadata?: Record<string, string>
  ) {
    super('test.event.created', '1.0', aggregateId, { key: 'value' }, correlationId, causationId, metadata);
  }
}

describe('BaseIntegrationEvent (seedwork package)', () => {
  it('should hold all event properties', () => {
    const event = new TestIntegrationEvent('agg-1', 'corr-1');

    expect(event.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(event.type).toBe('test.event.created');
    expect(event.version).toBe('1.0');
    expect(event.aggregateId).toBe('agg-1');
    expect(event.correlationId).toBe('corr-1');
    expect(event.occurredAt).toBeInstanceOf(Date);
  });

  it('should type the payload at compile time without a cast', () => {
    const event = new TestIntegrationEvent();

    expect(event.payload).toEqual({ key: 'value' });
    const key: string = event.payload.key;
    expect(key).toBe('value');
  });

  it('should default occurredAt to a Date when not provided', () => {
    const event = new TestIntegrationEvent();

    expect(event.occurredAt).toBeInstanceOf(Date);
  });

  it('should leave causationId and metadata undefined when not provided', () => {
    const event = new TestIntegrationEvent();

    expect(event.causationId).toBeUndefined();
    expect(event.metadata).toBeUndefined();
  });

  it('should hold causationId and metadata when provided', () => {
    const event = new TestIntegrationEvent('agg-1', 'corr-1', 'cause-1', { source: 'unit-test' });

    expect(event.causationId).toBe('cause-1');
    expect(event.metadata).toEqual({ source: 'unit-test' });
  });

  it('should generate unique ids per instance', () => {
    const a = new TestIntegrationEvent();
    const b = new TestIntegrationEvent();

    expect(a.id).not.toBe(b.id);
  });
});
