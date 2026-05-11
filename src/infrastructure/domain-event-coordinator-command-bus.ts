import type { Command, CommandBus, Result } from '../application/commands.js';
import type { DomainEventBus } from '../application/domain-event-bus.js';

export class DomainEventCoordinatorCommandBus implements CommandBus {
  constructor(
    private readonly inner: CommandBus,
    private readonly eventBus: DomainEventBus
  ) {}

  async dispatch(command: Command): Promise<Result> {
    const result = await this.inner.dispatch(command);
    if (result.isOk()) {
      await this.eventBus.dispatch();
    } else {
      this.eventBus.discard();
    }
    return result;
  }
}
