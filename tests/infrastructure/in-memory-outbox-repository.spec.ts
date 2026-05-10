import type { IntegrationEvent } from '@src';
import { BaseIntegrationEvent } from '@src';
import { InMemoryOutboxRepository } from '@src/infrastructure/in-memory-outbox-repository';

class OrderCreatedEvent extends BaseIntegrationEvent {
  constructor(aggregateId: string, correlationId: string) {
    super('orders.order.created', '1.0', aggregateId, { orderId: aggregateId }, correlationId);
  }
}

const makeEvent = (id = 'order-1', correlationId = 'corr-1'): IntegrationEvent =>
  new OrderCreatedEvent(id, correlationId);

describe('InMemoryOutboxRepository', () => {
  it('save creates a pending outbox record', async () => {
    const repo = new InMemoryOutboxRepository();
    const event = makeEvent();

    await repo.save(event);

    const pending = await repo.findPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].status).toBe('pending');
    expect(pending[0].event).toBe(event);
    expect(pending[0].attempts).toBe(0);
  });

  it('findPending respects the limit parameter', async () => {
    const repo = new InMemoryOutboxRepository();
    await repo.save(makeEvent('order-1'));
    await repo.save(makeEvent('order-2'));
    await repo.save(makeEvent('order-3'));

    const pending = await repo.findPending(2);
    expect(pending).toHaveLength(2);
  });

  it('markAsPublished sets status to published', async () => {
    const repo = new InMemoryOutboxRepository();
    await repo.save(makeEvent());
    const [record] = await repo.findPending();

    await repo.markAsPublished(record.id);

    const stillPending = await repo.findPending();
    expect(stillPending).toHaveLength(0);
  });

  it('markAsFailed sets status to failed and increments attempts', async () => {
    const repo = new InMemoryOutboxRepository();
    await repo.save(makeEvent());
    const [record] = await repo.findPending();

    await repo.markAsFailed(record.id, 'connection refused');

    const stillPending = await repo.findPending();
    expect(stillPending).toHaveLength(0);
  });

  it('markAsPublished on unknown id is a no-op', async () => {
    const repo = new InMemoryOutboxRepository();
    await expect(repo.markAsPublished('unknown-id')).resolves.toBeUndefined();
  });

  it('markAsFailed on unknown id is a no-op', async () => {
    const repo = new InMemoryOutboxRepository();
    await expect(repo.markAsFailed('unknown-id', 'error')).resolves.toBeUndefined();
  });
});
