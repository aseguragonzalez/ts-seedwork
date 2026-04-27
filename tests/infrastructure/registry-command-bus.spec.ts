import type { Command, CommandHandler } from '@seedwork/application/commands';
import { RegistryCommandBus } from '@seedwork/infrastructure/registry-command-bus';

class CreateUserCommand implements Command {
  constructor(public readonly name: string) {}
  validate(): void {}
}

class CreateUserHandler implements CommandHandler<CreateUserCommand> {
  public executed = false;
  public lastCommand: CreateUserCommand | undefined;

  async execute(command: CreateUserCommand): Promise<void> {
    this.executed = true;
    this.lastCommand = command;
  }
}

describe('RegistryCommandBus', () => {
  it('should dispatch to the registered handler', async () => {
    const bus = new RegistryCommandBus();
    const handler = new CreateUserHandler();
    bus.register(CreateUserCommand, handler);

    await bus.dispatch(new CreateUserCommand('Alice'));

    expect(handler.executed).toBe(true);
    expect(handler.lastCommand?.name).toBe('Alice');
  });

  it('should throw when no handler is registered', async () => {
    const bus = new RegistryCommandBus();

    await expect(bus.dispatch(new CreateUserCommand('Bob'))).rejects.toThrow(
      'No handler registered for command: CreateUserCommand'
    );
  });

  it('should allow overwriting a registered handler', async () => {
    const bus = new RegistryCommandBus();
    const first = new CreateUserHandler();
    const second = new CreateUserHandler();

    bus.register(CreateUserCommand, first);
    bus.register(CreateUserCommand, second);
    await bus.dispatch(new CreateUserCommand('Carol'));

    expect(first.executed).toBe(false);
    expect(second.executed).toBe(true);
  });
});
