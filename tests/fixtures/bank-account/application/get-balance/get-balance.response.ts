import { QueryResponse } from '@seedwork';

export interface BalanceData {
  accountId: string;
  owner: string;
  amount: number;
  currency: string;
}

export class GetBalanceResponse implements QueryResponse<BalanceData> {
  constructor(public readonly data: BalanceData) {}
}
