import { AsyncLocalStorage } from 'node:async_hooks';

import { DomainEvent, DomainEventBusContext } from '@aseguragonzalez/ts-seedwork';

/**
 * Reference implementation of `DomainEventBusContext` backed by `node:async_hooks`
 * `AsyncLocalStorage`. Each call to `run()` opens an isolated buffer for the duration of
 * `work` (and everything awaited transitively inside it) — this is what makes a single
 * `DeferredDomainEventBus` instance safe to reuse across concurrent, interleaved async
 * contexts (e.g. concurrent requests in a warm serverless process).
 *
 * `run()` is called once per unit of work at the entry point (see `buildCommandBus` in
 * `composition-root.ts`, which wraps every `commandBus.dispatch()` call) — this class does
 * not decide when a scope opens, it only exposes the mechanism.
 */
export class AsyncLocalDomainEventBusContext implements DomainEventBusContext {
  private readonly storage = new AsyncLocalStorage<Map<string, DomainEvent>>();

  run<T>(work: () => Promise<T>): Promise<T> {
    return this.storage.run(new Map<string, DomainEvent>(), work);
  }

  current(): Map<string, DomainEvent> {
    const store = this.storage.getStore();
    if (!store) {
      throw new Error('AsyncLocalDomainEventBusContext.current() called outside of run()');
    }
    return store;
  }
}
