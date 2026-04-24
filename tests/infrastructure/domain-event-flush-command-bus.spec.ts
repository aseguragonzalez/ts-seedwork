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

  it('should not flush if dispatch throws', async () => {
    const inner: CommandBus = {
      dispatch: jest.fn().mockRejectedValue(new Error('fail')),
    };
    const eventBus = new DeferredDomainEventBus();
    const flushSpy = jest.spyOn(eventBus, 'flush');
    const bus = new DomainEventFlushCommandBus(inner, eventBus);

    await expect(bus.dispatch(new DoSomething())).rejects.toThrow('fail');
    expect(flushSpy).not.toHaveBeenCalled();
  });
});
