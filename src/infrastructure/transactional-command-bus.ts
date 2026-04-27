import { Command, CommandBus, Result } from '../application/commands.js';
import { UnitOfWork } from '../domain/unit-of-work.js';

export class TransactionalCommandBus implements CommandBus {
  public constructor(
    private readonly inner: CommandBus,
    private readonly unitOfWork: UnitOfWork
  ) {}

  public async dispatch(command: Command): Promise<Result> {
    await this.unitOfWork.createSession();
    try {
      const result = await this.inner.dispatch(command);
      await this.unitOfWork.commit();
      return result;
    } catch (error) {
      await this.unitOfWork.rollback();
      throw error;
    }
  }
}
