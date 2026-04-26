import type { Command, CommandBus } from '../application/commands.js';
import { Result } from '../application/commands.js';

export class ValidationCommandBus implements CommandBus {
  public constructor(private readonly inner: CommandBus) {}

  public async dispatch(command: Command): Promise<Result> {
    command.validate();
    return this.inner.dispatch(command);
  }
}
