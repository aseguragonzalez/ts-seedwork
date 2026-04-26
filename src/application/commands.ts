export interface ResultError {
  code: string;
  description: string;
}

export class Result {
  readonly errors: ReadonlyArray<ResultError>;
  private readonly _isOk: boolean;

  private constructor(isOk: boolean, errors: ReadonlyArray<ResultError>) {
    this._isOk = isOk;
    this.errors = Object.freeze([...errors]);
    Object.freeze(this);
  }

  static ok(): Result {
    return new Result(true, []);
  }

  static fail(errors: ResultError[]): Result {
    return new Result(false, errors);
  }

  isOk(): boolean {
    return this._isOk;
  }

  isFail(): boolean {
    return !this._isOk;
  }
}

export interface Command {
  validate(): void;
}

export interface CommandHandler<TCommand extends Command> {
  execute(command: TCommand): Promise<void>;
}

export interface CommandBus {
  dispatch(command: Command): Promise<Result>;
}

export type CommandBusMiddleware = (inner: CommandBus) => CommandBus;
