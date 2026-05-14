import {
  CommandBusBuilder,
  DeferredDomainEventBus,
  DomainEventPublishingRepository,
  InMemoryIntegrationEventPublisher,
  QueryBusBuilder,
} from '@aseguragonzalez/ts-seedwork';

import { AccountOpened } from '../domain/events/account-opened.js';
import { InMemoryBankAccountRepository } from '../infrastructure/in-memory-bank-account.repository.js';
import { AccountOpenedDomainEventHandler } from './account-opened.domain-event-handler.js';
import { DepositMoneyCommand } from './deposit-money/deposit-money.command.js';
import { DepositMoneyHandler } from './deposit-money/deposit-money.handler.js';
import { GetBalanceHandler } from './get-balance/get-balance.handler.js';
import { GetBalanceQuery } from './get-balance/get-balance.query.js';
import { OpenAccountCommand } from './open-account/open-account.command.js';
import { OpenAccountHandler } from './open-account/open-account.handler.js';
import { WithdrawMoneyCommand } from './withdraw-money/withdraw-money.command.js';
import { WithdrawMoneyHandler } from './withdraw-money/withdraw-money.handler.js';

export function buildCommandBus() {
  const integrationEventPublisher = new InMemoryIntegrationEventPublisher();
  const domainEventBus = new DeferredDomainEventBus();
  const bankAccountRepository = new InMemoryBankAccountRepository();
  const publishingRepository = new DomainEventPublishingRepository(bankAccountRepository, domainEventBus);

  domainEventBus.subscribe(AccountOpened, new AccountOpenedDomainEventHandler(integrationEventPublisher));

  const commandBus = new CommandBusBuilder()
    .register(OpenAccountCommand, new OpenAccountHandler(publishingRepository))
    .register(DepositMoneyCommand, new DepositMoneyHandler(publishingRepository))
    .register(WithdrawMoneyCommand, new WithdrawMoneyHandler(publishingRepository))
    .withValidation()
    .withDomainEventCoordination(domainEventBus)
    .build();

  const queryBus = new QueryBusBuilder()
    .register(GetBalanceQuery, new GetBalanceHandler(bankAccountRepository))
    .withValidation()
    .build();

  return { commandBus, queryBus, integrationEventPublisher, domainEventBus };
}
