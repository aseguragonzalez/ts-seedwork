import { Query } from '@aseguragonzalez/ts-seedwork';

export class GetBalanceQuery extends Query {
  constructor(public readonly accountId: string) {
    super();
    this.validate();
  }

  protected validate(): void {}
}
