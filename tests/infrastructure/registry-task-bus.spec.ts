import type { BackgroundTask, TaskHandler } from '@src';
import { RegistryTaskBus } from '@src/infrastructure/registry-task-bus';

const makeTask = (type: string): BackgroundTask => ({
  id: crypto.randomUUID(),
  type,
  payload: {},
  status: 'pending',
  scheduledAt: new Date(),
  attempts: 0,
  maxAttempts: 3,
  correlationId: 'corr-1',
});

describe('RegistryTaskBus', () => {
  it('dispatches to the registered handler', async () => {
    const bus = new RegistryTaskBus();
    const handled: BackgroundTask[] = [];
    const handler: TaskHandler = {
      handle: jest.fn(async task => {
        handled.push(task);
      }),
    };
    bus.register('send-email', handler);
    const task = makeTask('send-email');

    await bus.dispatch(task);

    expect(handler.handle).toHaveBeenCalledWith(task);
    expect(handled).toHaveLength(1);
  });

  it('throws when no handler is registered for the task type', async () => {
    const bus = new RegistryTaskBus();
    const task = makeTask('unknown-task');

    await expect(bus.dispatch(task)).rejects.toThrow('No handler registered for task type: unknown-task');
  });

  it('register overwrites an existing handler for the same type', async () => {
    const bus = new RegistryTaskBus();
    const first: TaskHandler = { handle: jest.fn() };
    const second: TaskHandler = { handle: jest.fn() };
    bus.register('send-email', first);
    bus.register('send-email', second);
    const task = makeTask('send-email');

    await bus.dispatch(task);

    expect(first.handle).not.toHaveBeenCalled();
    expect(second.handle).toHaveBeenCalledWith(task);
  });
});
