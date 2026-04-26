import type { Command, CommandBus, CommandHandler } from '../application/commands.js';
import type { UnitOfWork } from '../domain/unit-of-work.js';
import { RegistryCommandBus } from './registry-command-bus.js';
import { TransactionalCommandBus } from './transactional-command-bus.js';
import { ValidationCommandBus } from './validation-command-bus.js';

export class CommandBusBuilder {
  private readonly registry = new RegistryCommandBus();
  private readonly steps: Array<(inner: CommandBus) => CommandBus> = [];

  register<TCommand extends Command>(
    commandType: new (..._args: any[]) => TCommand,
    handler: CommandHandler<TCommand>
  ): this {
    this.registry.register(commandType, handler);
    return this;
  }

  withValidation(): this {
    this.steps.push(inner => new ValidationCommandBus(inner));
    return this;
  }

  withTransaction(unitOfWork: UnitOfWork): this {
    this.steps.push(inner => new TransactionalCommandBus(inner, unitOfWork));
    return this;
  }

  use(factory: (inner: CommandBus) => CommandBus): this {
    this.steps.push(factory);
    return this;
  }

  build(): CommandBus {
    let bus: CommandBus = this.registry;
    for (const step of [...this.steps].reverse()) {
      bus = step(bus);
    }
    return bus;
  }
}
