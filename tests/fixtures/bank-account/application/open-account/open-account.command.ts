import { Command } from '@seedwork';

export class OpenAccountCommand implements Command {
  constructor(
    public readonly accountId: string,
    public readonly owner: string,
    public readonly initialAmount: number,
    public readonly currency: string
  ) {}
}
