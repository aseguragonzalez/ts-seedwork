import { AsyncLocalStorage } from 'node:async_hooks';

export const correlationContext = new AsyncLocalStorage<string>();
