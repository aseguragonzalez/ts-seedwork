import { Command, CommandBus, Result } from '@seedwork/application/commands';
import { UnitOfWork } from '@seedwork/domain/unit-of-work';
import { TransactionalCommandBus } from '@seedwork/infrastructure/transactional-command-bus';

class DoSomething implements Command {
  validate(): void {}
}

describe('TransactionalCommandBus (seedwork package)', () => {
  const makeUow = (): jest.Mocked<UnitOfWork> => ({
    createSession: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
  });

  const makeInner = (impl?: () => Promise<Result>): CommandBus => ({
    dispatch: jest.fn(impl ?? (() => Promise.resolve(Result.ok()))),
  });

  it('should open session, dispatch, then commit on success', async () => {
    const uow = makeUow();
    const inner = makeInner();
    const bus = new TransactionalCommandBus(inner, uow);

    await bus.dispatch(new DoSomething());

    expect(uow.createSession).toHaveBeenCalledTimes(1);
    expect(inner.dispatch).toHaveBeenCalledWith(expect.any(DoSomething));
    expect(uow.commit).toHaveBeenCalledTimes(1);
    expect(uow.rollback).not.toHaveBeenCalled();
  });

  it('should rollback and rethrow on handler failure', async () => {
    const uow = makeUow();
    const inner = makeInner(() => Promise.reject(new Error('handler failed')));
    const bus = new TransactionalCommandBus(inner, uow);

    await expect(bus.dispatch(new DoSomething())).rejects.toThrow('handler failed');

    expect(uow.createSession).toHaveBeenCalledTimes(1);
    expect(uow.rollback).toHaveBeenCalledTimes(1);
    expect(uow.commit).not.toHaveBeenCalled();
  });
});
