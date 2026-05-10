import type { Command, CommandBus } from '@src';
import { Result } from '@src';
import { DeferredDomainEventBus } from '@src/infrastructure/deferred-domain-event-bus';
import { DomainEventFlushCommandBus } from '@src/infrastructure/domain-event-flush-command-bus';

class DoSomething implements Command {
  validate(): void {}
}

const makeInner = (impl: (command: Command) => Promise<Result>): CommandBus => ({
  dispatch: jest.fn(impl),
});

describe('DomainEventFlushCommandBus', () => {
  it('calls flush when inner bus returns ok result', async () => {
    const inner = makeInner(() => Promise.resolve(Result.ok()));
    const eventBus = new DeferredDomainEventBus();
    jest.spyOn(eventBus, 'flush');
    jest.spyOn(eventBus, 'clear');
    const bus = new DomainEventFlushCommandBus(inner, eventBus);

    const result = await bus.dispatch(new DoSomething());

    expect(result.isOk()).toBe(true);
    expect(eventBus.flush).toHaveBeenCalledTimes(1);
    expect(eventBus.clear).not.toHaveBeenCalled();
  });

  it('calls clear (not flush) when inner bus returns fail result', async () => {
    const inner = makeInner(() => Promise.resolve(Result.fail([{ code: 'ERR', description: 'domain error' }])));
    const eventBus = new DeferredDomainEventBus();
    jest.spyOn(eventBus, 'flush');
    jest.spyOn(eventBus, 'clear');
    const bus = new DomainEventFlushCommandBus(inner, eventBus);

    const result = await bus.dispatch(new DoSomething());

    expect(result.isFail()).toBe(true);
    expect(eventBus.clear).toHaveBeenCalledTimes(1);
    expect(eventBus.flush).not.toHaveBeenCalled();
  });

  it('propagates infrastructure exception without calling flush or clear', async () => {
    const inner = makeInner(() => Promise.reject(new Error('infra failure')));
    const eventBus = new DeferredDomainEventBus();
    jest.spyOn(eventBus, 'flush');
    jest.spyOn(eventBus, 'clear');
    const bus = new DomainEventFlushCommandBus(inner, eventBus);

    await expect(bus.dispatch(new DoSomething())).rejects.toThrow('infra failure');
    expect(eventBus.flush).not.toHaveBeenCalled();
    expect(eventBus.clear).not.toHaveBeenCalled();
  });
});
