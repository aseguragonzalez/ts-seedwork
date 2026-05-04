import { Query } from '@aseguragonzalez/ts-seedwork';

export class GetBalanceQuery implements Query {
  constructor(public readonly accountId: string) {}

  validate(): void {}
}
