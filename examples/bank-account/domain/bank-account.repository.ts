import { Repository } from '@seedwork';

import { BankAccount } from './bank-account.js';
import { BankAccountId } from './bank-account-id.js';

export interface BankAccountRepository extends Repository<BankAccountId, BankAccount> {}
