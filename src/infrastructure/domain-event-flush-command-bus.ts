import { Command, CommandBus } from '../application/commands.js';
import { DeferredDomainEventBus } from './deferred-domain-event-bus.js';

export class DomainEventFlushCommandBus implements CommandBus {
  public constructor(
    private readonly inner: CommandBus,
    private readonly eventBus: DeferredDomainEventBus
  ) {}

  public async dispatch(command: Command): Promise<void> {
    try {
      await this.inner.dispatch(command);
    } catch (error) {
      this.eventBus.clear();
      throw error;
    }
    await this.eventBus.flush();
  }
}
