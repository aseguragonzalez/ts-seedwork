import type { Command, CommandBus, CommandHandler } from '../application/commands.js';

type HandlerForCommand = CommandHandler<Command>;

export class RegistryCommandBus implements CommandBus {
  private readonly handlers = new Map<Function, HandlerForCommand>();

  public register<T extends Command>(commandType: new (..._args: any[]) => T, handler: CommandHandler<T>): void {
    this.handlers.set(commandType, handler as HandlerForCommand);
  }

  public async dispatch(command: Command): Promise<void> {
    const handler = this.handlers.get(command.constructor);
    if (!handler) {
      throw new Error(`No handler registered for command: ${command.constructor.name}`);
    }
    await handler.execute(command);
  }
}
