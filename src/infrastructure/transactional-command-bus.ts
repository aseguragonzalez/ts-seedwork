import { Command, CommandBus, Result } from '../application/commands.js';
import { UnitOfWork } from '../domain/unit-of-work.js';

export class TransactionalCommandBus implements CommandBus {
  public constructor(
    private readonly inner: CommandBus,
    private readonly unitOfWork: UnitOfWork
  ) {}

  public async dispatch(command: Command): Promise<Result> {
    await this.unitOfWork.createSession();
    let result: Result;
    try {
      result = await this.inner.dispatch(command);
    } catch (error) {
      await this.unitOfWork.rollback();
      throw error;
    }

    if (result.isFailed()) {
      await this.unitOfWork.rollback();
      return result;
    }

    try {
      await this.unitOfWork.commit();
    } catch (error) {
      await this.unitOfWork.rollback();
      throw error;
    }
    return result;
  }
}
