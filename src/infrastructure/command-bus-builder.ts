import type { Command, CommandBus, CommandHandler } from '../application/commands.js';
import type { UnitOfWork } from '../domain/unit-of-work.js';
import { RegistryCommandBus } from './registry-command-bus.js';
import { TransactionalCommandBus } from './transactional-command-bus.js';
import { ValidationCommandBus } from './validation-command-bus.js';

export class CommandBusBuilder {
  private readonly registry = new RegistryCommandBus();
  private unitOfWork: UnitOfWork | undefined;
  private addValidation = false;

  register<TCommand extends Command>(
    commandType: new (..._args: any[]) => TCommand,
    handler: CommandHandler<TCommand>
  ): this {
    this.registry.register(commandType, handler);
    return this;
  }

  withValidation(): this {
    this.addValidation = true;
    return this;
  }

  withTransaction(unitOfWork: UnitOfWork): this {
    this.unitOfWork = unitOfWork;
    return this;
  }

  build(): CommandBus {
    let bus: CommandBus = this.registry;
    if (this.unitOfWork) {
      bus = new TransactionalCommandBus(bus, this.unitOfWork);
    }
    if (this.addValidation) {
      bus = new ValidationCommandBus(bus);
    }
    return bus;
  }
}
