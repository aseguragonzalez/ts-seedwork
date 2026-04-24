import { Command, CommandBus } from '../application/commands.js';
import { UnitOfWork } from '../domain/unit-of-work.js';

export class TransactionalCommandBus implements CommandBus {
  public constructor(
    private readonly inner: CommandBus,
    private readonly unitOfWork: UnitOfWork
  ) {}

  public async dispatch(command: Command): Promise<void> {
    await this.unitOfWork.createSession();
    try {
      await this.inner.dispatch(command);
      await this.unitOfWork.commit();
    } catch (error) {
      await this.unitOfWork.rollback();
      throw error;
    }
  }
}
