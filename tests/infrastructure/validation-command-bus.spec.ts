import type { Command } from '@seedwork';
import { Result, ValidationErrors } from '@seedwork';
import type { CommandBus } from '@seedwork/application/commands';
import { ValidationCommandBus } from '@seedwork/infrastructure/validation-command-bus';

class ValidCommand implements Command {
  public validate(): void {}
}

class InvalidCommand implements Command {
  public validate(): void {
    throw new ValidationErrors([{ code: 'REQUIRED_NAME', message: 'Name is required' }]);
  }
}

describe('ValidationCommandBus', () => {
  it('dispatches to inner bus when validate passes', async () => {
    const inner: CommandBus = { dispatch: jest.fn().mockResolvedValue(Result.ok()) };
    const bus = new ValidationCommandBus(inner);

    const result = await bus.dispatch(new ValidCommand());

    expect(inner.dispatch).toHaveBeenCalledTimes(1);
    expect(result.isOk()).toBe(true);
  });

  it('throws ValidationErrors before reaching inner bus', async () => {
    const inner: CommandBus = { dispatch: jest.fn() };
    const bus = new ValidationCommandBus(inner);

    await expect(bus.dispatch(new InvalidCommand())).rejects.toThrow(ValidationErrors);
    expect(inner.dispatch).not.toHaveBeenCalled();
  });

  it('propagates ValidationErrors with error details', async () => {
    const inner: CommandBus = { dispatch: jest.fn() };
    const bus = new ValidationCommandBus(inner);

    try {
      await bus.dispatch(new InvalidCommand());
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationErrors);
      if (e instanceof ValidationErrors) {
        expect(e.errors[0].code).toBe('REQUIRED_NAME');
      }
    }
  });
});
