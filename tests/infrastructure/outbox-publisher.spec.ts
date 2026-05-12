import type { BackgroundTask, IntegrationEvent, IntegrationEventOutboxRepository, TaskOutboxRepository } from '@src';
import { BaseBackgroundTask, BaseIntegrationEvent, OutboxIntegrationEventPublisher, OutboxTaskScheduler } from '@src';

class OrderCreatedEvent extends BaseIntegrationEvent {
  constructor(aggregateId: string, correlationId: string) {
    super('orders.order.created', '1.0', aggregateId, { orderId: aggregateId }, correlationId);
  }
}

class SendEmailTask extends BaseBackgroundTask {
  constructor(correlationId: string) {
    super('send-email', { to: 'test@example.com' }, correlationId);
  }
}

const makeEvent = (id = 'order-1', correlationId = 'corr-1'): IntegrationEvent =>
  new OrderCreatedEvent(id, correlationId);

const makeTask = (correlationId = 'corr-1'): BackgroundTask => new SendEmailTask(correlationId);

describe('OutboxIntegrationEventPublisher', () => {
  it('delegates each event to the repository save method', async () => {
    const repository: jest.Mocked<IntegrationEventOutboxRepository> = {
      save: jest.fn().mockResolvedValue(undefined),
      findPending: jest.fn(),
      markAsPublished: jest.fn(),
      markAsFailed: jest.fn(),
    };
    const publisher = new OutboxIntegrationEventPublisher(repository);
    const event1 = makeEvent('order-1');
    const event2 = makeEvent('order-2');

    await publisher.publish([event1, event2]);

    expect(repository.save).toHaveBeenCalledTimes(2);
    expect(repository.save).toHaveBeenCalledWith(event1);
    expect(repository.save).toHaveBeenCalledWith(event2);
  });

  it('publish with empty array calls save zero times', async () => {
    const repository: jest.Mocked<IntegrationEventOutboxRepository> = {
      save: jest.fn().mockResolvedValue(undefined),
      findPending: jest.fn(),
      markAsPublished: jest.fn(),
      markAsFailed: jest.fn(),
    };
    const publisher = new OutboxIntegrationEventPublisher(repository);

    await publisher.publish([]);

    expect(repository.save).not.toHaveBeenCalled();
  });
});

describe('OutboxTaskScheduler', () => {
  it('delegates the task to the repository save method', async () => {
    const repository: jest.Mocked<TaskOutboxRepository> = {
      save: jest.fn().mockResolvedValue(undefined),
      findPending: jest.fn(),
      markAsDelivered: jest.fn(),
      markAsFailed: jest.fn(),
    };
    const scheduler = new OutboxTaskScheduler(repository);
    const task = makeTask();

    await scheduler.schedule(task);

    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledWith(task);
  });
});
