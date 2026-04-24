import { DomainEventHandler } from '@seedwork/application/domain-events';
import { BaseDomainEvent, DomainEvent } from '@seedwork/domain/domain-event';
import { DeferredDomainEventBus } from '@seedwork/infrastructure/deferred-domain-event-bus';

class TestEvent extends BaseDomainEvent {
  constructor(id: string) {
    super(id, 'TestEvent', { id }, new Date(), '1.0.0');
  }
}

class FailEvent extends BaseDomainEvent {
  constructor(id: string) {
    super(id, 'FailEvent', { id }, new Date(), '1.0.0');
  }
}

describe('DeferredDomainEventBus (seedwork package)', () => {
  it('should buffer events and flush to handlers', async () => {
    const bus = new DeferredDomainEventBus();
    const handled: DomainEvent[] = [];
    const handler: DomainEventHandler = { handle: async e => void handled.push(e) };

    bus.subscribe('TestEvent', [handler]);
    await bus.publish([new TestEvent('1'), new TestEvent('2')]);

    expect(handled).toHaveLength(0);

    await bus.flush();

    expect(handled).toHaveLength(2);
    expect(handled[0].id).toBe('1');
    expect(handled[1].id).toBe('2');
  });

  it('should clear the buffer after flush', async () => {
    const bus = new DeferredDomainEventBus();
    const handled: DomainEvent[] = [];
    const handler: DomainEventHandler = { handle: async e => void handled.push(e) };

    bus.subscribe('TestEvent', [handler]);
    await bus.publish([new TestEvent('1')]);
    await bus.flush();
    await bus.flush();

    expect(handled).toHaveLength(1);
  });

  it('should dispatch to multiple handlers for the same event type', async () => {
    const bus = new DeferredDomainEventBus();
    const callA = jest.fn().mockResolvedValue(undefined);
    const callB = jest.fn().mockResolvedValue(undefined);

    bus.subscribe('TestEvent', [{ handle: callA }, { handle: callB }]);
    await bus.publish([new TestEvent('x')]);
    await bus.flush();

    expect(callA).toHaveBeenCalledTimes(1);
    expect(callB).toHaveBeenCalledTimes(1);
  });

  it('should ignore events with no subscribers', async () => {
    const bus = new DeferredDomainEventBus();
    await bus.publish([new TestEvent('orphan')]);
    await expect(bus.flush()).resolves.not.toThrow();
  });

  it('should restore unprocessed events to the buffer when a handler throws', async () => {
    const bus = new DeferredDomainEventBus();
    const handled: string[] = [];
    let shouldFail = true;
    const failOnceHandler: DomainEventHandler = {
      handle: async e => {
        if (shouldFail) {
          shouldFail = false;
          throw new Error('handler failure');
        }
        handled.push(e.id);
      },
    };
    const successHandler: DomainEventHandler = {
      handle: async e => void handled.push(e.id),
    };

    bus.subscribe('TestEvent', [successHandler]);
    bus.subscribe('FailEvent', [failOnceHandler]);

    await bus.publish([new TestEvent('1'), new FailEvent('2'), new TestEvent('3')]);

    // first flush: dispatches TestEvent('1') then throws on FailEvent('2')
    await expect(bus.flush()).rejects.toThrow('handler failure');

    // only '1' was dispatched; '2' and '3' must have been restored to the buffer
    expect(handled).toEqual(['1']);

    // second flush: FailEvent handler no longer throws, remaining events are dispatched
    await bus.flush();
    expect(handled).toContain('2');
    expect(handled).toContain('3');
  });
});
