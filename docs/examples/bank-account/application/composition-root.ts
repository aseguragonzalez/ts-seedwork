/**
 * Example composition root showing the full bus stack:
 * Validation > Transactional > EventCoordination > RegistryCommandBus
 *
 * This file is for documentation purposes only.
 */
import {
  CommandBusBuilder,
  DeferredDomainEventBus,
  DomainEventPublishingRepository,
  InMemoryIntegrationEventPublisher,
} from '@aseguragonzalez/ts-seedwork';

import { InMemoryBankAccountRepository } from '../infrastructure/in-memory-bank-account.repository.js';
import { AccountOpenedDomainEventHandler } from './account-opened.domain-event-handler.js';
import { DepositMoneyHandler } from './deposit-money/deposit-money.handler.js';
import { OpenAccountHandler } from './open-account/open-account.handler.js';

export function buildCommandBus() {
  const integrationEventPublisher = new InMemoryIntegrationEventPublisher();
  const domainEventBus = new DeferredDomainEventBus();

  const bankAccountRepository = new DomainEventPublishingRepository(
    new InMemoryBankAccountRepository(),
    domainEventBus
  );

  // Subscribe domain event handlers
  domainEventBus.subscribe(
    // AccountOpened is dynamically imported here but in production
    // you'd import it directly
    Object as any,
    new AccountOpenedDomainEventHandler(integrationEventPublisher)
  );

  // Build the command bus stack: Validation > EventCoordination > Registry
  const commandBus = new CommandBusBuilder()
    .register(OpenAccountHandler as any, new OpenAccountHandler(bankAccountRepository as any))
    .register(DepositMoneyHandler as any, new DepositMoneyHandler(bankAccountRepository as any))
    .withValidation()
    // .withTransaction(unitOfWork) — add when using a real DB
    .withDomainEventCoordination(domainEventBus)
    .build();

  return { commandBus, integrationEventPublisher, domainEventBus };
}
