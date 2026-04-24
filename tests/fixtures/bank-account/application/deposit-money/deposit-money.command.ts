import { Command } from '@seedwork';

export class DepositMoneyCommand implements Command {
  constructor(
    public readonly accountId: string,
    public readonly amount: number,
    public readonly currency: string
  ) {}
}
