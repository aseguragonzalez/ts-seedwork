import type { BackgroundTask } from '@src';
import { BaseBackgroundTask } from '@src';
import { InMemoryTaskOutboxRepository } from '@src/testing/in-memory-outbox-repositories';

class SendEmailTask extends BaseBackgroundTask {
  constructor(correlationId: string) {
    super('send-email', { to: 'test@example.com' }, correlationId);
  }
}

const makeTask = (correlationId = 'corr-1'): BackgroundTask => new SendEmailTask(correlationId);

describe('InMemoryTaskOutboxRepository', () => {
  it('save creates a pending task record', async () => {
    const repo = new InMemoryTaskOutboxRepository();
    const task = makeTask();

    await repo.save(task);

    const pending = await repo.findPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].status).toBe('pending');
    expect(pending[0].task).toBe(task);
    expect(pending[0].attempts).toBe(0);
  });

  it('findPending respects the limit parameter', async () => {
    const repo = new InMemoryTaskOutboxRepository();
    await repo.save(makeTask('corr-1'));
    await repo.save(makeTask('corr-2'));
    await repo.save(makeTask('corr-3'));

    const pending = await repo.findPending(2);
    expect(pending).toHaveLength(2);
  });

  it('markAsDelivered sets status to published', async () => {
    const repo = new InMemoryTaskOutboxRepository();
    await repo.save(makeTask());
    const [record] = await repo.findPending();

    await repo.markAsDelivered(record.id);

    const stillPending = await repo.findPending();
    expect(stillPending).toHaveLength(0);
    expect(repo.all[0].deliveredAt).toBeInstanceOf(Date);
  });

  it('markAsFailed sets status to failed and increments attempts', async () => {
    const repo = new InMemoryTaskOutboxRepository();
    await repo.save(makeTask());
    const [record] = await repo.findPending();

    await repo.markAsFailed(record.id, 'timeout');

    const stillPending = await repo.findPending();
    expect(stillPending).toHaveLength(0);
    expect(repo.all[0].status).toBe('failed');
    expect(repo.all[0].attempts).toBe(1);
    expect(repo.all[0].lastError).toBe('timeout');
  });

  it('markAsDelivered on unknown id is a no-op', async () => {
    const repo = new InMemoryTaskOutboxRepository();
    await expect(repo.markAsDelivered('unknown-id')).resolves.toBeUndefined();
  });

  it('markAsFailed on unknown id is a no-op', async () => {
    const repo = new InMemoryTaskOutboxRepository();
    await expect(repo.markAsFailed('unknown-id', 'error')).resolves.toBeUndefined();
  });

  it('all returns all records regardless of status', async () => {
    const repo = new InMemoryTaskOutboxRepository();
    await repo.save(makeTask('corr-1'));
    await repo.save(makeTask('corr-2'));
    const [first] = await repo.findPending();
    await repo.markAsDelivered(first.id);

    expect(repo.all).toHaveLength(2);
  });

  it('reset clears all records', async () => {
    const repo = new InMemoryTaskOutboxRepository();
    await repo.save(makeTask());

    repo.reset();

    expect(repo.all).toHaveLength(0);
  });
});
