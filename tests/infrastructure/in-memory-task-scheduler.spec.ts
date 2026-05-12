import type { BackgroundTask, TaskHandler } from '@src';
import { BaseBackgroundTask } from '@src';
import { InMemoryTaskScheduler } from '@src/infrastructure/in-memory-task-scheduler';

class SendEmailTask extends BaseBackgroundTask {
  constructor(correlationId: string, id?: string) {
    super('send-email', { to: 'test@example.com' }, correlationId, undefined, undefined, id);
  }
}

const makeTask = (correlationId = 'corr-1'): BackgroundTask => new SendEmailTask(correlationId);

const makeHandler = (): { handler: TaskHandler; handled: BackgroundTask[] } => {
  const handled: BackgroundTask[] = [];
  const handler: TaskHandler = {
    handle: jest.fn(async (task: BackgroundTask) => {
      handled.push(task);
    }),
  };
  return { handler, handled };
};

describe('InMemoryTaskScheduler', () => {
  it('schedule adds task to the scheduled list', async () => {
    const scheduler = new InMemoryTaskScheduler();
    const task = makeTask();

    await scheduler.schedule(task);

    expect(scheduler.scheduled).toHaveLength(1);
    expect(scheduler.scheduled[0]).toBe(task);
  });

  it('scheduled getter returns all scheduled tasks', async () => {
    const scheduler = new InMemoryTaskScheduler();
    await scheduler.schedule(makeTask('corr-1'));
    await scheduler.schedule(makeTask('corr-2'));

    expect(scheduler.scheduled).toHaveLength(2);
  });

  it('executeScheduled invokes registered handlers', async () => {
    const scheduler = new InMemoryTaskScheduler();
    const { handler, handled } = makeHandler();
    scheduler.register('send-email', handler);
    const task = makeTask();
    await scheduler.schedule(task);

    await scheduler.executeScheduled();

    expect(handled).toHaveLength(1);
    expect(handled[0]).toBe(task);
  });

  it('executeScheduled skips tasks with no registered handler', async () => {
    const scheduler = new InMemoryTaskScheduler();
    await scheduler.schedule(makeTask());

    await expect(scheduler.executeScheduled()).resolves.toBeUndefined();
  });

  it('reset clears the scheduled list', async () => {
    const scheduler = new InMemoryTaskScheduler();
    await scheduler.schedule(makeTask());

    scheduler.reset();

    expect(scheduler.scheduled).toHaveLength(0);
  });

  it('executeScheduled runs all tasks in order', async () => {
    const scheduler = new InMemoryTaskScheduler();
    const order: string[] = [];
    const handler: TaskHandler = {
      handle: jest.fn(async (task: BackgroundTask) => {
        order.push(task.correlationId);
      }),
    };
    scheduler.register('send-email', handler);
    await scheduler.schedule(makeTask('first'));
    await scheduler.schedule(makeTask('second'));

    await scheduler.executeScheduled();

    expect(order).toEqual(['first', 'second']);
  });
});
