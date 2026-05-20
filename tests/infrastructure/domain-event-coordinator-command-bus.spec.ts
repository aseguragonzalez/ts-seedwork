import type { Command, CommandBus } from '@src';
import { Result } from '@src';
import { DeferredDomainEventBus } from '@src/infrastructure/deferred-domain-event-bus';
import { DomainEventCoordinatorCommandBus } from '@src/infrastructure/domain-event-coordinator-command-bus';

class DoSomething implements Command {
  validate(): void {}
}

const makeInner = (impl: (command: Command) => Promise<Result>): CommandBus => ({
  dispatch: jest.fn(impl),
});

describe('DomainEventCoordinatorCommandBus', () => {
  it('calls dispatch when inner bus returns ok result', async () => {
    const inner = makeInner(() => Promise.resolve(Result.ok()));
    const eventBus = new DeferredDomainEventBus();
    jest.spyOn(eventBus, 'dispatch');
    jest.spyOn(eventBus, 'discard');
    const bus = new DomainEventCoordinatorCommandBus(inner, eventBus);

    const result = await bus.dispatch(new DoSomething());

    expect(result.isOk()).toBe(true);
    expect(eventBus.dispatch).toHaveBeenCalledTimes(1);
    expect(eventBus.discard).not.toHaveBeenCalled();
  });

  it('calls discard (not dispatch) when inner bus returns fail result', async () => {
    const inner = makeInner(() => Promise.resolve(Result.failed([{ code: 'ERR', description: 'domain error' }])));
    const eventBus = new DeferredDomainEventBus();
    jest.spyOn(eventBus, 'dispatch');
    jest.spyOn(eventBus, 'discard');
    const bus = new DomainEventCoordinatorCommandBus(inner, eventBus);

    const result = await bus.dispatch(new DoSomething());

    expect(result.isFail()).toBe(true);
    expect(eventBus.discard).toHaveBeenCalledTimes(1);
    expect(eventBus.dispatch).not.toHaveBeenCalled();
  });

  it('propagates infrastructure exception without calling dispatch or discard', async () => {
    const inner = makeInner(() => Promise.reject(new Error('infra failure')));
    const eventBus = new DeferredDomainEventBus();
    jest.spyOn(eventBus, 'dispatch');
    jest.spyOn(eventBus, 'discard');
    const bus = new DomainEventCoordinatorCommandBus(inner, eventBus);

    await expect(bus.dispatch(new DoSomething())).rejects.toThrow('infra failure');
    expect(eventBus.dispatch).not.toHaveBeenCalled();
    expect(eventBus.discard).not.toHaveBeenCalled();
  });
});
