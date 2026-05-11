import { BaseIntegrationEvent } from '@src';
import { InMemoryIntegrationEventPublisher } from '@src/infrastructure/in-memory-integration-event-publisher';

class OrderCreatedEvent extends BaseIntegrationEvent {
  constructor(aggregateId: string) {
    super('orders.order.created', '1.0', aggregateId, { orderId: aggregateId }, 'corr-1');
  }
}

describe('InMemoryIntegrationEventPublisher', () => {
  it('published starts empty', () => {
    const publisher = new InMemoryIntegrationEventPublisher();
    expect(publisher.published).toHaveLength(0);
  });

  it('publish accumulates events', async () => {
    const publisher = new InMemoryIntegrationEventPublisher();
    const event1 = new OrderCreatedEvent('order-1');
    const event2 = new OrderCreatedEvent('order-2');

    await publisher.publish([event1]);
    await publisher.publish([event2]);

    expect(publisher.published).toHaveLength(2);
    expect(publisher.published[0]).toBe(event1);
    expect(publisher.published[1]).toBe(event2);
  });

  it('published getter returns a readonly view', async () => {
    const publisher = new InMemoryIntegrationEventPublisher();
    await publisher.publish([new OrderCreatedEvent('order-1')]);

    const published = publisher.published;
    expect(published).toHaveLength(1);
  });

  it('reset empties the published list', async () => {
    const publisher = new InMemoryIntegrationEventPublisher();
    await publisher.publish([new OrderCreatedEvent('order-1')]);

    publisher.reset();

    expect(publisher.published).toHaveLength(0);
  });

  it('publish with empty array does not add entries', async () => {
    const publisher = new InMemoryIntegrationEventPublisher();

    await publisher.publish([]);

    expect(publisher.published).toHaveLength(0);
  });
});
