import { AsyncLocalStorage } from 'node:async_hooks';

import {
  BaseDomainEvent,
  DeferredDomainEventBus,
  type DomainEvent,
  type DomainEventBusContext,
  type DomainEventHandler,
} from '@src';
import { DeferredDomainEventBusSpy } from '@src/testing/deferred-domain-event-bus-spy';

const singleBufferContext = (): DomainEventBusContext => {
  const buffer = new Map<string, DomainEvent>();
  return { current: () => buffer };
};

class AsyncLocalDomainEventBusContext implements DomainEventBusContext {
  private readonly storage = new AsyncLocalStorage<Map<string, DomainEvent>>();

  run<T>(work: () => Promise<T>): Promise<T> {
    return this.storage.run(new Map<string, DomainEvent>(), work);
  }

  current(): Map<string, DomainEvent> {
    const store = this.storage.getStore();
    if (!store) {
      throw new Error('no scope open');
    }
    return store;
  }
}

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
    const bus = new DeferredDomainEventBus(singleBufferContext());
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
    const bus = new DeferredDomainEventBus(singleBufferContext());
    const { handler } = makeHandler<OrderPlaced>();
    bus.subscribe(OrderPlaced, handler);

    await bus.dispatch();

    expect(handler.handle).not.toHaveBeenCalled();
  });

  it('multiple handlers for the same event type are all invoked', async () => {
    const bus = new DeferredDomainEventBus(singleBufferContext());
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
    const bus = new DeferredDomainEventBus(singleBufferContext());

    await bus.publish([new OrderPlaced('order-1')]);
    await expect(bus.dispatch()).resolves.toBeUndefined();
  });

  it('discard empties the buffer without dispatching', async () => {
    const bus = new DeferredDomainEventBus(singleBufferContext());
    const { handler } = makeHandler<OrderPlaced>();
    bus.subscribe(OrderPlaced, handler);

    await bus.publish([new OrderPlaced('order-1')]);
    bus.discard();
    await bus.dispatch();

    expect(handler.handle).not.toHaveBeenCalled();
  });

  it('handlers for different event types are dispatched independently', async () => {
    const bus = new DeferredDomainEventBus(singleBufferContext());
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
    const bus = new DeferredDomainEventBus(singleBufferContext());
    const { handler } = makeHandler<OrderPlaced>();
    bus.subscribe(OrderPlaced, handler);

    const event = new OrderPlaced('order-1');
    await bus.publish([event]);
    await bus.publish([event]);
    await bus.dispatch();

    expect(handler.handle).toHaveBeenCalledTimes(1);
  });

  it('constructing without a context argument preserves prior single-buffer behavior', async () => {
    const bus = new DeferredDomainEventBus();
    const { handler, received } = makeHandler<OrderPlaced>();
    bus.subscribe(OrderPlaced, handler);

    const event = new OrderPlaced('order-1');
    await bus.publish([event]);
    await bus.dispatch();

    expect(handler.handle).toHaveBeenCalledTimes(1);
    expect(received[0]).toBe(event);
  });
});

describe('DeferredDomainEventBus cascading dispatch', () => {
  it('dispatches an event published by a handler during the same dispatch', async () => {
    const bus = new DeferredDomainEventBus(singleBufferContext());
    const payments = makeHandler<PaymentReceived>();
    bus.subscribe(OrderPlaced, {
      handle: async (event: OrderPlaced) => bus.publish([new PaymentReceived(event.aggregateId, 10)]),
    });
    bus.subscribe(PaymentReceived, payments.handler);

    await bus.publish([new OrderPlaced('order-1')]);
    await bus.dispatch();

    expect(payments.received).toHaveLength(1);
    expect(payments.received[0]?.aggregateId).toBe('order-1');
  });

  it('dispatches events raised several handler levels deep, each level after the previous one', async () => {
    const bus = new DeferredDomainEventBus(singleBufferContext());
    const order: string[] = [];
    bus.subscribe(OrderPlaced, {
      handle: async (event: OrderPlaced) => {
        order.push(`placed:${event.aggregateId}`);
        await bus.publish([new PaymentReceived(event.aggregateId, 1)]);
      },
    });
    bus.subscribe(PaymentReceived, {
      handle: async (event: PaymentReceived) => {
        order.push(`paid:${event.aggregateId}:${event.payload.amount}`);
        if (event.payload.amount < 3) {
          await bus.publish([new PaymentReceived(event.aggregateId, event.payload.amount + 1)]);
        }
      },
    });

    await bus.publish([new OrderPlaced('order-1')]);
    await bus.dispatch();

    expect(order).toEqual(['placed:order-1', 'paid:order-1:1', 'paid:order-1:2', 'paid:order-1:3']);
  });

  it('leaves the buffer empty once the cascade settles', async () => {
    const bus = new DeferredDomainEventBusSpy(singleBufferContext());
    bus.subscribe(OrderPlaced, {
      handle: async (event: OrderPlaced) => bus.publish([new PaymentReceived(event.aggregateId, 10)]),
    });

    await bus.publish([new OrderPlaced('order-1')]);
    await bus.dispatch();

    expect(bus.pending).toEqual([]);
  });

  it('fails after a bounded number of rounds when handlers keep publishing, and clears the buffer', async () => {
    const bus = new DeferredDomainEventBusSpy(singleBufferContext());
    let rounds = 0;
    bus.subscribe(OrderPlaced, {
      handle: async (event: OrderPlaced) => {
        rounds++;
        await bus.publish([new OrderPlaced(`${event.aggregateId}+`)]);
      },
    });

    await bus.publish([new OrderPlaced('order-1')]);

    await expect(bus.dispatch()).rejects.toThrow('Domain events were still being published after 10 dispatch rounds');
    expect(rounds).toBe(10);
    expect(bus.pending).toEqual([]);
  });

  it('clears events published before a handler fails and rethrows the failure', async () => {
    const bus = new DeferredDomainEventBusSpy(singleBufferContext());
    const failure = new Error('handler failed');
    const payments = makeHandler<PaymentReceived>();
    bus.subscribe(OrderPlaced, {
      handle: async (event: OrderPlaced) => {
        await bus.publish([new PaymentReceived(event.aggregateId, 10)]);
        throw failure;
      },
    });
    bus.subscribe(PaymentReceived, payments.handler);

    await bus.publish([new OrderPlaced('order-1')]);

    await expect(bus.dispatch()).rejects.toBe(failure);
    expect(payments.received).toEqual([]);
    expect(bus.pending).toEqual([]);
  });

  it('keeps cascades of concurrent async contexts apart', async () => {
    const context = new AsyncLocalDomainEventBusContext();
    const bus = new DeferredDomainEventBus(context);
    const payments = makeHandler<PaymentReceived>();
    bus.subscribe(OrderPlaced, {
      handle: async (event: OrderPlaced) => {
        await new Promise(resolve => setTimeout(resolve, 5));
        await bus.publish([new PaymentReceived(event.aggregateId, 10)]);
      },
    });
    bus.subscribe(PaymentReceived, payments.handler);

    await Promise.all(
      ['order-1', 'order-2'].map(orderId =>
        context.run(async () => {
          await bus.publish([new OrderPlaced(orderId)]);
          await bus.dispatch();
        })
      )
    );

    expect(payments.received.map(event => event.aggregateId).sort()).toEqual(['order-1', 'order-2']);
  });
});

describe('DeferredDomainEventBusSpy', () => {
  it('pending returns buffered events before dispatch', async () => {
    const bus = new DeferredDomainEventBusSpy(singleBufferContext());
    const event1 = new OrderPlaced('order-1');
    const event2 = new OrderPlaced('order-2');
    await bus.publish([event1, event2]);

    expect(bus.pending).toHaveLength(2);
    expect(bus.pending).toContain(event1);
    expect(bus.pending).toContain(event2);
  });

  it('pending is empty after dispatch', async () => {
    const bus = new DeferredDomainEventBusSpy(singleBufferContext());
    await bus.publish([new OrderPlaced('order-1')]);
    await bus.dispatch();

    expect(bus.pending).toHaveLength(0);
  });

  it('pending is empty after discard', async () => {
    const bus = new DeferredDomainEventBusSpy(singleBufferContext());
    await bus.publish([new OrderPlaced('order-1')]);
    bus.discard();

    expect(bus.pending).toHaveLength(0);
  });

  it('reset clears pending events without dispatching', async () => {
    const bus = new DeferredDomainEventBusSpy(singleBufferContext());
    const { handler } = makeHandler<OrderPlaced>();
    bus.subscribe(OrderPlaced, handler);
    await bus.publish([new OrderPlaced('order-1')]);
    bus.reset();

    expect(bus.pending).toHaveLength(0);
    expect(handler.handle).not.toHaveBeenCalled();
  });

  it('reset clears subscribed handlers', async () => {
    const bus = new DeferredDomainEventBusSpy(singleBufferContext());
    const { handler } = makeHandler<OrderPlaced>();
    bus.subscribe(OrderPlaced, handler);
    bus.reset();

    await bus.publish([new OrderPlaced('order-1')]);
    await bus.dispatch();

    expect(handler.handle).not.toHaveBeenCalled();
  });

  it('constructing without a context argument preserves prior single-buffer behavior', async () => {
    const bus = new DeferredDomainEventBusSpy();
    await bus.publish([new OrderPlaced('order-1')]);

    expect(bus.pending).toHaveLength(1);
  });
});

describe('DeferredDomainEventBus concurrency (AsyncLocalStorage context)', () => {
  it('isolates buffered events across concurrent async contexts sharing a single bus instance', async () => {
    const context = new AsyncLocalDomainEventBusContext();
    const bus = new DeferredDomainEventBus(context);
    const { handler, received } = makeHandler<OrderPlaced>();
    bus.subscribe(OrderPlaced, handler);

    const runRequest = (orderId: string) =>
      context.run(async () => {
        await bus.publish([new OrderPlaced(orderId)]);
        // yield to interleave with the other concurrent request before dispatching
        await new Promise(resolve => setImmediate(resolve));
        await bus.dispatch();
      });

    await Promise.all([runRequest('order-a'), runRequest('order-b')]);

    expect(handler.handle).toHaveBeenCalledTimes(2);
    expect(received.map(event => event.payload.orderId).sort()).toEqual(['order-a', 'order-b']);
  });
});
