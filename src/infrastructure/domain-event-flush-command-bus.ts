import type { Command, CommandBus } from '../application/commands.js';
import type { Result } from '../application/commands.js';
import type { DeferredDomainEventBus } from './deferred-domain-event-bus.js';

export class DomainEventFlushCommandBus implements CommandBus {
  constructor(
    private readonly inner: CommandBus,
    private readonly eventBus: DeferredDomainEventBus
  ) {}

  async dispatch(command: Command): Promise<Result> {
    const result = await this.inner.dispatch(command);
    if (result.isOk()) {
      await this.eventBus.flush();
    } else {
      this.eventBus.clear();
    }
    return result;
  }
}
