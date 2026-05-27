export interface ResultError {
  code: string;
  description: string;
}

export class Result {
  readonly errors: ReadonlyArray<ResultError>;
  private readonly ok: boolean;

  private constructor(isOk: boolean, errors: ReadonlyArray<ResultError>) {
    this.ok = isOk;
    this.errors = Object.freeze([...errors]);
    Object.freeze(this);
  }

  static ok(): Result {
    return new Result(true, []);
  }

  static failed(errors: ResultError[]): Result {
    return new Result(false, errors);
  }

  isOk(): boolean {
    return this.ok;
  }

  isFailed(): boolean {
    return !this.ok;
  }
}

export abstract class Command {
  protected constructor() {}
  protected abstract validate(): void;
}

export interface CommandHandler<TCommand extends Command> {
  handle(command: TCommand): Promise<void>;
}

export interface CommandBus {
  dispatch(command: Command): Promise<Result>;
}

export type CommandBusMiddleware = (inner: CommandBus) => CommandBus;
