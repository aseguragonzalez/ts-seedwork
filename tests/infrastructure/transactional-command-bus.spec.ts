import { Command, type CommandBus, Result } from '@src/application/commands';
import { UnitOfWork } from '@src/domain/unit-of-work';
import { TransactionalCommandBus } from '@src/infrastructure/transactional-command-bus';

class DoSomething extends Command {
  constructor() {
    super();
    this.validate();
  }
  protected validate(): void {}
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

  it('should rollback, not commit, and return the same failed Result when inner bus returns Result.failed', async () => {
    const uow = makeUow();
    const failed = Result.failed([{ code: 'ERR', description: 'fail' }]);
    const inner = makeInner(() => Promise.resolve(failed));
    const bus = new TransactionalCommandBus(inner, uow);

    const result = await bus.dispatch(new DoSomething());

    expect(result).toBe(failed);
    expect(result.isFailed()).toBe(true);
    expect(result.errors[0].code).toBe('ERR');
    expect(uow.createSession).toHaveBeenCalledTimes(1);
    expect(uow.rollback).toHaveBeenCalledTimes(1);
    expect(uow.commit).not.toHaveBeenCalled();
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

  it('should rollback and rethrow when commit throws', async () => {
    const uow = makeUow();
    uow.commit.mockRejectedValue(new Error('commit failed'));
    const inner = makeInner();
    const bus = new TransactionalCommandBus(inner, uow);

    await expect(bus.dispatch(new DoSomething())).rejects.toThrow('commit failed');

    expect(uow.createSession).toHaveBeenCalledTimes(1);
    expect(uow.commit).toHaveBeenCalledTimes(1);
    expect(uow.rollback).toHaveBeenCalledTimes(1);
  });
});
