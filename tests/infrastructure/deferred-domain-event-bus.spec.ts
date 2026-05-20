import { BaseDomainEvent, DeferredDomainEventBus, DeferredDomainEventBusSpy, DomainEventHandler } from '@src';

class OrderPlaced extends BaseDomainEvent<{ orderId: string }> {
  constructor(orderId: string) {
    super(orderId, { orderId });
  }
}

class PaymentReceived extends BaseDomainEvent<{ amount: number }> {
  constructor(aggregateId: string, amount: number) {
    super(aggregateId, { amount });
  }
}

const makeHandler = <T extends { id: string; aggregateId: string; occurredAt: Date }>() => {
  const received: T[] = [];
  const handler: DomainEventHandler<T> = {
    handle: jest.fn(async (event: T) => {
      received.push(event);
    }),
  };
  return { handler, received };
};

describe('DeferredDomainEventBus', () => {
  it('subscribe + publish + dispatch invokes handlers in order', async () => {
    const bus = new DeferredDomainEventBus();
    const { handler, received } = makeHandler<OrderPlaced>();
    bus.subscribe(OrderPlaced, handler);

    const event1 = new OrderPlaced('order-1');
    const event2 = new OrderPlaced('order-2');
    await bus.publish([event1, event2]);
    await bus.dispatch();

    expect(handler.handle).toHaveBeenCalledTimes(2);
    expect(received[0]).toBe(event1);
    expect(received[1]).toBe(event2);
  });

  it('dispatch with no pending events is a no-op', async () => {
    const bus = new DeferredDomainEventBus();
    const { handler } = makeHandler<OrderPlaced>();
    bus.subscribe(OrderPlaced, handler);

    await bus.dispatch();

    expect(handler.handle).not.toHaveBeenCalled();
  });

  it('multiple handlers for the same event type are all invoked', async () => {
    const bus = new DeferredDomainEventBus();
    const { handler: h1 } = makeHandler<OrderPlaced>();
    const { handler: h2 } = makeHandler<OrderPlaced>();
    bus.subscribe(OrderPlaced, h1);
    bus.subscribe(OrderPlaced, h2);

    await bus.publish([new OrderPlaced('order-1')]);
    await bus.dispatch();

    expect(h1.handle).toHaveBeenCalledTimes(1);
    expect(h2.handle).toHaveBeenCalledTimes(1);
  });

  it('event without a subscribed handler does not throw', async () => {
    const bus = new DeferredDomainEventBus();

    await bus.publish([new OrderPlaced('order-1')]);
    await expect(bus.dispatch()).resolves.toBeUndefined();
  });

  it('discard empties the buffer without dispatching', async () => {
    const bus = new DeferredDomainEventBus();
    const { handler } = makeHandler<OrderPlaced>();
    bus.subscribe(OrderPlaced, handler);

    await bus.publish([new OrderPlaced('order-1')]);
    bus.discard();
    await bus.dispatch();

    expect(handler.handle).not.toHaveBeenCalled();
  });

  it('handlers for different event types are dispatched independently', async () => {
    const bus = new DeferredDomainEventBus();
    const { handler: orderHandler, received: orderReceived } = makeHandler<OrderPlaced>();
    const { handler: paymentHandler, received: paymentReceived } = makeHandler<PaymentReceived>();
    bus.subscribe(OrderPlaced, orderHandler);
    bus.subscribe(PaymentReceived, paymentHandler);

    await bus.publish([new OrderPlaced('order-1'), new PaymentReceived('agg-1', 100)]);
    await bus.dispatch();

    expect(orderReceived).toHaveLength(1);
    expect(paymentReceived).toHaveLength(1);
  });

  it('publishing the same event id twice is idempotent - handler invoked once', async () => {
    const bus = new DeferredDomainEventBus();
    const { handler } = makeHandler<OrderPlaced>();
    bus.subscribe(OrderPlaced, handler);

    const event = new OrderPlaced('order-1');
    await bus.publish([event]);
    await bus.publish([event]);
    await bus.dispatch();

    expect(handler.handle).toHaveBeenCalledTimes(1);
  });
});

describe('DeferredDomainEventBusSpy', () => {
  it('pending returns buffered events before dispatch', async () => {
    const bus = new DeferredDomainEventBusSpy();
    const event1 = new OrderPlaced('order-1');
    const event2 = new OrderPlaced('order-2');
    await bus.publish([event1, event2]);

    expect(bus.pending).toHaveLength(2);
    expect(bus.pending).toContain(event1);
    expect(bus.pending).toContain(event2);
  });

  it('pending is empty after dispatch', async () => {
    const bus = new DeferredDomainEventBusSpy();
    await bus.publish([new OrderPlaced('order-1')]);
    await bus.dispatch();

    expect(bus.pending).toHaveLength(0);
  });

  it('pending is empty after discard', async () => {
    const bus = new DeferredDomainEventBusSpy();
    await bus.publish([new OrderPlaced('order-1')]);
    bus.discard();

    expect(bus.pending).toHaveLength(0);
  });

  it('reset clears pending events without dispatching', async () => {
    const bus = new DeferredDomainEventBusSpy();
    const { handler } = makeHandler<OrderPlaced>();
    bus.subscribe(OrderPlaced, handler);
    await bus.publish([new OrderPlaced('order-1')]);
    bus.reset();

    expect(bus.pending).toHaveLength(0);
    expect(handler.handle).not.toHaveBeenCalled();
  });

  it('reset clears subscribed handlers', async () => {
    const bus = new DeferredDomainEventBusSpy();
    const { handler } = makeHandler<OrderPlaced>();
    bus.subscribe(OrderPlaced, handler);
    bus.reset();

    await bus.publish([new OrderPlaced('order-1')]);
    await bus.dispatch();

    expect(handler.handle).not.toHaveBeenCalled();
  });
});
