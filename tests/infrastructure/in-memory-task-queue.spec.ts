import type { BackgroundTask } from '@src';
import { InMemoryTaskQueue } from '@src/infrastructure/in-memory-task-queue';

const makeTask = (overrides: Partial<BackgroundTask> = {}): BackgroundTask => ({
  id: crypto.randomUUID(),
  type: 'send-email',
  payload: {},
  status: 'pending',
  scheduledAt: new Date(),
  attempts: 0,
  maxAttempts: 3,
  correlationId: 'corr-1',
  ...overrides,
});

describe('InMemoryTaskQueue', () => {
  it('enqueue adds a task and dequeue claims it as running', async () => {
    const queue = new InMemoryTaskQueue();
    const task = makeTask({ id: 'task-1' });
    await queue.enqueue(task);

    const claimed = await queue.dequeue();

    expect(claimed).not.toBeNull();
    expect(claimed!.id).toBe('task-1');
    expect(claimed!.status).toBe('running');
    expect(claimed!.startedAt).toBeInstanceOf(Date);
  });

  it('dequeue on empty queue returns null', async () => {
    const queue = new InMemoryTaskQueue();
    const result = await queue.dequeue();
    expect(result).toBeNull();
  });

  it('ack marks a task as completed', async () => {
    const queue = new InMemoryTaskQueue();
    await queue.enqueue(makeTask({ id: 'task-1' }));
    await queue.dequeue();

    await queue.ack('task-1');

    const task = await queue.findById('task-1');
    expect(task!.status).toBe('completed');
    expect(task!.completedAt).toBeInstanceOf(Date);
  });

  it('nack with remaining attempts re-enqueues as pending', async () => {
    const queue = new InMemoryTaskQueue();
    await queue.enqueue(makeTask({ id: 'task-1', maxAttempts: 3 }));
    await queue.dequeue();

    await queue.nack('task-1', 'temporary error');

    const task = await queue.findById('task-1');
    expect(task!.status).toBe('pending');
    expect(task!.attempts).toBe(1);
    expect(task!.lastError).toBe('temporary error');
  });

  it('nack when maxAttempts reached marks task as failed', async () => {
    const queue = new InMemoryTaskQueue();
    await queue.enqueue(makeTask({ id: 'task-1', maxAttempts: 1 }));
    await queue.dequeue();

    await queue.nack('task-1', 'permanent error');

    const task = await queue.findById('task-1');
    expect(task!.status).toBe('failed');
    expect(task!.attempts).toBe(1);
  });

  it('findById returns null for unknown task', async () => {
    const queue = new InMemoryTaskQueue();
    const result = await queue.findById('non-existent');
    expect(result).toBeNull();
  });

  it('findById returns the task by id', async () => {
    const queue = new InMemoryTaskQueue();
    const task = makeTask({ id: 'task-42' });
    await queue.enqueue(task);

    const found = await queue.findById('task-42');
    expect(found).not.toBeNull();
    expect(found!.id).toBe('task-42');
  });

  it('dequeue skips running tasks and returns next pending', async () => {
    const queue = new InMemoryTaskQueue();
    await queue.enqueue(makeTask({ id: 'task-1' }));
    await queue.enqueue(makeTask({ id: 'task-2' }));
    await queue.dequeue(); // task-1 is now running

    const claimed = await queue.dequeue();

    expect(claimed!.id).toBe('task-2');
  });
});
