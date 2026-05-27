import { Command, type CommandBus, type CommandHandler, DomainError, Result } from '@src';
import type { UnitOfWork } from '@src/domain/unit-of-work';
import { CommandBusBuilder } from '@src/infrastructure/command-bus-builder';
import { DeferredDomainEventBus } from '@src/infrastructure/deferred-domain-event-bus';

class DoSomething extends Command {
  constructor() {
    super();
    this.validate();
  }
  protected validate(): void {}
}

class DoSomethingHandler implements CommandHandler<DoSomething> {
  public calls = 0;
  async handle(_command: DoSomething): Promise<void> {
    this.calls++;
  }
}

class RuleViolatedError extends DomainError {
  constructor() {
    super('rule violated', 'RULE_VIOLATED');
  }
}

class DomainErrorHandler implements CommandHandler<DoSomething> {
  async handle(_command: DoSomething): Promise<void> {
    throw new RuleViolatedError();
  }
}

class InfraErrorHandler implements CommandHandler<DoSomething> {
  async handle(_command: DoSomething): Promise<void> {
    throw new Error('infra failure');
  }
}

const makeUow = (): jest.Mocked<UnitOfWork> => ({
  createSession: jest.fn().mockResolvedValue(undefined),
  commit: jest.fn().mockResolvedValue(undefined),
  rollback: jest.fn().mockResolvedValue(undefined),
});

const makeSpy = () => {
  const calls: string[] = [];
  const factory = (inner: CommandBus): CommandBus => ({
    async dispatch(command: Command): Promise<Result> {
      calls.push('before');
      const result = await inner.dispatch(command);
      calls.push('after');
      return result;
    },
  });
  return { factory, calls };
};

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

      expect(result.isFailed()).toBe(true);
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

    it('opens session and commits on DomainError (converted to Result.failed)', async () => {
      const uow = makeUow();
      const bus = new CommandBusBuilder().register(DoSomething, new DomainErrorHandler()).withTransaction(uow).build();

      const result = await bus.dispatch(new DoSomething());

      expect(result.isFailed()).toBe(true);
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

    it('calling withTransaction twice nests two transaction layers', async () => {
      const uow1 = makeUow();
      const uow2 = makeUow();
      const bus = new CommandBusBuilder()
        .register(DoSomething, new DoSomethingHandler())
        .withTransaction(uow1)
        .withTransaction(uow2)
        .build();

      await bus.dispatch(new DoSomething());

      expect(uow1.createSession).toHaveBeenCalledTimes(1);
      expect(uow2.createSession).toHaveBeenCalledTimes(1);
      expect(uow1.commit).toHaveBeenCalledTimes(1);
      expect(uow2.commit).toHaveBeenCalledTimes(1);
    });
  });

  describe('use (custom steps)', () => {
    it('custom step is invoked during dispatch', async () => {
      const handler = new DoSomethingHandler();
      const { factory, calls } = makeSpy();
      const bus = new CommandBusBuilder().register(DoSomething, handler).use(factory).build();

      await bus.dispatch(new DoSomething());

      expect(calls).toEqual(['before', 'after']);
      expect(handler.calls).toBe(1);
    });

    it('multiple custom steps run in declaration order', async () => {
      const order: number[] = [];
      const makeOrderedSpy =
        (id: number) =>
        (inner: CommandBus): CommandBus => ({
          async dispatch(command: Command): Promise<Result> {
            order.push(id);
            return inner.dispatch(command);
          },
        });

      const bus = new CommandBusBuilder()
        .register(DoSomething, new DoSomethingHandler())
        .use(makeOrderedSpy(1))
        .use(makeOrderedSpy(2))
        .use(makeOrderedSpy(3))
        .build();

      await bus.dispatch(new DoSomething());

      expect(order).toEqual([1, 2, 3]);
    });
  });

  describe('withDomainEventCoordination', () => {
    it('dispatches domain events when command succeeds', async () => {
      const handler = new DoSomethingHandler();
      const eventBus = new DeferredDomainEventBus();
      jest.spyOn(eventBus, 'dispatch');
      jest.spyOn(eventBus, 'discard');
      const bus = new CommandBusBuilder().register(DoSomething, handler).withDomainEventCoordination(eventBus).build();

      const result = await bus.dispatch(new DoSomething());

      expect(result.isOk()).toBe(true);
      expect(eventBus.dispatch).toHaveBeenCalledTimes(1);
      expect(eventBus.discard).not.toHaveBeenCalled();
    });

    it('discards domain events when command returns DomainError', async () => {
      const eventBus = new DeferredDomainEventBus();
      jest.spyOn(eventBus, 'dispatch');
      jest.spyOn(eventBus, 'discard');
      const bus = new CommandBusBuilder()
        .register(DoSomething, new DomainErrorHandler())
        .withDomainEventCoordination(eventBus)
        .build();

      const result = await bus.dispatch(new DoSomething());

      expect(result.isFailed()).toBe(true);
      expect(eventBus.discard).toHaveBeenCalledTimes(1);
      expect(eventBus.dispatch).not.toHaveBeenCalled();
    });
  });
});
