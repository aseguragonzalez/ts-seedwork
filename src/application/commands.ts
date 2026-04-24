export interface Command {}

export interface CommandHandler<TCommand extends Command> {
  execute(command: TCommand): Promise<void>;
}

export interface CommandBus {
  dispatch(command: Command): Promise<void>;
}
