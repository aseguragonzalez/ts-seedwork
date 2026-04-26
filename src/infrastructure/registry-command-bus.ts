import type { Command, CommandBus, CommandHandler } from '../application/commands.js';
import { Result } from '../application/commands.js';
import { DomainError } from '../domain/errors/index.js';

type HandlerForCommand = CommandHandler<Command>;

export class RegistryCommandBus implements CommandBus {
  private readonly handlers = new Map<Function, HandlerForCommand>();

  public register<TCommand extends Command>(
    commandType: new (..._args: any[]) => TCommand,
    handler: CommandHandler<TCommand>
  ): void {
    this.handlers.set(commandType, handler as HandlerForCommand);
  }

  public async dispatch(command: Command): Promise<Result> {
    const handler = this.handlers.get(command.constructor);
    if (!handler) {
      throw new Error(`No handler registered for command: ${command.constructor.name}`);
    }
    try {
      await handler.execute(command);
      return Result.ok();
    } catch (error) {
      if (error instanceof DomainError) {
        return Result.fail([{ code: error.code, description: error.message }]);
      }
      throw error;
    }
  }
}
