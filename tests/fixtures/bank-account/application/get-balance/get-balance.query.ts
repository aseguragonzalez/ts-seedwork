import { Query } from '@seedwork';

export class GetBalanceQuery implements Query {
  constructor(public readonly accountId: string) {}
}
