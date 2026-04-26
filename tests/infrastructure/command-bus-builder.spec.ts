import type { Command, CommandHandler } from '@seedwork';
import { DomainError, ValidationErrors } from '@seedwork';
import type { UnitOfWork } from '@seedwork/domain/unit-of-work';
import { CommandBusBuilder } from '@seedwork/infrastructure/command-bus-builder';

class DoSomething implements Command {
  constructor(public readonly valid: boolean = true) {}
  validate(): void {
    if (!this.valid) throw new ValidationErrors([{ code: 'INVALID', message: 'invalid' }]);
  }
}

class DoSomethingHandler implements CommandHandler<DoSomething> {
  public calls = 0;
  async execute(_command: DoSomething): Promise<void> {
    this.calls++;
  }
}

class DomainErrorHandler implements CommandHandler<DoSomething> {
  async execute(_command: DoSomething): Promise<void> {
    throw new DomainError('rule violated', 'RULE_VIOLATED');
  }
}

class InfraErrorHandler implements CommandHandler<DoSomething> {
  async execute(_command: DoSomething): Promise<void> {
    throw new Error('infra failure');
  }
}

const makeUow = (): jest.Mocked<UnitOfWork> => ({
  createSession: jest.fn().mockResolvedValue(undefined),
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
});

describe('CommandBusBuilder', () => {
  describe('base registry', () => {
    it('dispatches to registered handler and returns ok', async () => {
      const handler = new DoSomethingHandler();
      const bus = new CommandBusBuilder().register(DoSomething, handler).build();

      const result = await bus.dispatch(new DoSomething());

      expect(result.isOk()).toBe(true);
      expect(handler.calls).toBe(1);
    });

    it('returns fail when handler throws DomainError', async () => {
      const bus = new CommandBusBuilder().register(DoSomething, new DomainErrorHandler()).build();

      const result = await bus.dispatch(new DoSomething());

      expect(result.isFail()).toBe(true);
      expect(result.errors[0].code).toBe('RULE_VIOLATED');
    });

    it('rethrows unexpected exceptions', async () => {
      const bus = new CommandBusBuilder().register(DoSomething, new InfraErrorHandler()).build();

      await expect(bus.dispatch(new DoSomething())).rejects.toThrow('infra failure');
    });

    it('throws when no handler is registered', async () => {
      const bus = new CommandBusBuilder().build();

      await expect(bus.dispatch(new DoSomething())).rejects.toThrow('No handler registered');
    });
  });

  describe('withValidation', () => {
    it('dispatches when command is valid', async () => {
      const handler = new DoSomethingHandler();
      const bus = new CommandBusBuilder().register(DoSomething, handler).withValidation().build();

      const result = await bus.dispatch(new DoSomething(true));

      expect(result.isOk()).toBe(true);
      expect(handler.calls).toBe(1);
    });

    it('throws ValidationErrors before reaching handler when command is invalid', async () => {
      const handler = new DoSomethingHandler();
      const bus = new CommandBusBuilder().register(DoSomething, handler).withValidation().build();

      await expect(bus.dispatch(new DoSomething(false))).rejects.toThrow(ValidationErrors);
      expect(handler.calls).toBe(0);
    });

    it('calling withValidation twice is idempotent', async () => {
      const handler = new DoSomethingHandler();
      const bus = new CommandBusBuilder().register(DoSomething, handler).withValidation().withValidation().build();

      const result = await bus.dispatch(new DoSomething(true));

      expect(result.isOk()).toBe(true);
      expect(handler.calls).toBe(1);
    });
  });

  describe('withTransaction', () => {
    it('opens session and commits on ok result', async () => {
      const uow = makeUow();
      const bus = new CommandBusBuilder().register(DoSomething, new DoSomethingHandler()).withTransaction(uow).build();

      const result = await bus.dispatch(new DoSomething());

      expect(result.isOk()).toBe(true);
      expect(uow.createSession).toHaveBeenCalledTimes(1);
      expect(uow.commit).toHaveBeenCalledTimes(1);
      expect(uow.rollback).not.toHaveBeenCalled();
    });

    it('opens session and commits on DomainError (converted to Result.fail)', async () => {
      const uow = makeUow();
      const bus = new CommandBusBuilder().register(DoSomething, new DomainErrorHandler()).withTransaction(uow).build();

      const result = await bus.dispatch(new DoSomething());

      expect(result.isFail()).toBe(true);
      expect(uow.createSession).toHaveBeenCalledTimes(1);
      expect(uow.commit).toHaveBeenCalledTimes(1);
      expect(uow.rollback).not.toHaveBeenCalled();
    });

    it('rolls back and rethrows on unexpected exception', async () => {
      const uow = makeUow();
      const bus = new CommandBusBuilder().register(DoSomething, new InfraErrorHandler()).withTransaction(uow).build();

      await expect(bus.dispatch(new DoSomething())).rejects.toThrow('infra failure');
      expect(uow.rollback).toHaveBeenCalledTimes(1);
      expect(uow.commit).not.toHaveBeenCalled();
    });

    it('last withTransaction call wins', async () => {
      const uow1 = makeUow();
      const uow2 = makeUow();
      const bus = new CommandBusBuilder()
        .register(DoSomething, new DoSomethingHandler())
        .withTransaction(uow1)
        .withTransaction(uow2)
        .build();

      await bus.dispatch(new DoSomething());

      expect(uow2.createSession).toHaveBeenCalledTimes(1);
      expect(uow1.createSession).not.toHaveBeenCalled();
    });
  });

  describe('withValidation + withTransaction', () => {
    it('validates before opening the transaction', async () => {
      const uow = makeUow();
      const handler = new DoSomethingHandler();
      const bus = new CommandBusBuilder().register(DoSomething, handler).withValidation().withTransaction(uow).build();

      await expect(bus.dispatch(new DoSomething(false))).rejects.toThrow(ValidationErrors);
      expect(uow.createSession).not.toHaveBeenCalled();
      expect(handler.calls).toBe(0);
    });

    it('full stack succeeds for a valid command', async () => {
      const uow = makeUow();
      const handler = new DoSomethingHandler();
      const bus = new CommandBusBuilder().register(DoSomething, handler).withValidation().withTransaction(uow).build();

      const result = await bus.dispatch(new DoSomething(true));

      expect(result.isOk()).toBe(true);
      expect(uow.commit).toHaveBeenCalledTimes(1);
      expect(handler.calls).toBe(1);
    });

    it('composition order of builder calls does not affect stack order', async () => {
      const uow = makeUow();
      const handler = new DoSomethingHandler();
      const bus = new CommandBusBuilder().register(DoSomething, handler).withTransaction(uow).withValidation().build();

      await expect(bus.dispatch(new DoSomething(false))).rejects.toThrow(ValidationErrors);
      expect(uow.createSession).not.toHaveBeenCalled();
    });
  });
});
