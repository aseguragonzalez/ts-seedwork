import { Command, CommandBus } from '@seedwork/application/commands';
import { DeferredDomainEventBus } from '@seedwork/infrastructure/deferred-domain-event-bus';
import { DomainEventFlushCommandBus } from '@seedwork/infrastructure/domain-event-flush-command-bus';

class DoSomething implements Command {}

describe('DomainEventFlushCommandBus (seedwork package)', () => {
  it('should flush event bus after successful dispatch', async () => {
    const inner: CommandBus = { dispatch: jest.fn().mockResolvedValue(undefined) };
    const eventBus = new DeferredDomainEventBus();
    const flushSpy = jest.spyOn(eventBus, 'flush');
    const bus = new DomainEventFlushCommandBus(inner, eventBus);

    await bus.dispatch(new DoSomething());

    expect(inner.dispatch).toHaveBeenCalledWith(expect.any(DoSomething));
    expect(flushSpy).toHaveBeenCalledTimes(1);
  });

  it('should clear the event bus buffer if dispatch throws', async () => {
    const inner: CommandBus = {
      dispatch: jest.fn().mockRejectedValue(new Error('fail')),
    };
    const eventBus = new DeferredDomainEventBus();
    const flushSpy = jest.spyOn(eventBus, 'flush');
    const clearSpy = jest.spyOn(eventBus, 'clear');
    const bus = new DomainEventFlushCommandBus(inner, eventBus);

    await expect(bus.dispatch(new DoSomething())).rejects.toThrow('fail');
    expect(flushSpy).not.toHaveBeenCalled();
    expect(clearSpy).toHaveBeenCalledTimes(1);
  });

  it('should discard buffered events published during a failed command', async () => {
    const eventBus = new DeferredDomainEventBus();
    const handled: string[] = [];
    const handler = { handle: jest.fn().mockImplementation(async (e: { id: string }) => void handled.push(e.id)) };
    eventBus.subscribe('TestEvent', [handler]);

    const inner: CommandBus = {
      dispatch: jest.fn().mockImplementation(async () => {
        // simulate a handler publishing events then throwing
        await eventBus.publish([
          { id: 'e1', eventName: 'TestEvent', payload: {}, occurredAt: new Date(), version: '1' },
        ]);
        throw new Error('command failed');
      }),
    };
    const bus = new DomainEventFlushCommandBus(inner, eventBus);

    await expect(bus.dispatch(new DoSomething())).rejects.toThrow('command failed');

    // buffer must have been cleared — a subsequent flush should dispatch nothing
    await eventBus.flush();
    expect(handled).toHaveLength(0);
  });
});
