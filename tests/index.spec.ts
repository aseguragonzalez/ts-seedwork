import {
  DeferredDomainEventBusSpy,
  InMemoryIntegrationEventOutboxRepository,
  InMemoryIntegrationEventPublisher,
  InMemoryRepository,
  InMemoryTaskOutboxRepository,
  InMemoryTaskScheduler,
} from '@aseguragonzalez/ts-seedwork/testing';
import {
  AggregateRoot,
  BaseBackgroundTask,
  BaseDomainEvent,
  CommandBusBuilder,
  DeferredDomainEventBus,
  DomainError,
  DomainEventCoordinatorCommandBus,
  DomainEventPublishingRepository,
  Entity,
  Maybe,
  OutboxIntegrationEventPublisher,
  OutboxTaskScheduler,
  QueryBusBuilder,
  RegistryCommandBus,
  RegistryQueryBus,
  Result,
  TransactionalCommandBus,
  ValidationErrors,
  ValueObject,
} from '@src';

describe('main barrel exports all production classes', () => {
  it('exports all public API classes', () => {
    expect(AggregateRoot).toBeDefined();
    expect(BaseDomainEvent).toBeDefined();
    expect(BaseBackgroundTask).toBeDefined();
    expect(CommandBusBuilder).toBeDefined();
    expect(DomainError).toBeDefined();
    expect(DomainEventCoordinatorCommandBus).toBeDefined();
    expect(DomainEventPublishingRepository).toBeDefined();
    expect(DeferredDomainEventBus).toBeDefined();
    expect(Entity).toBeDefined();
    expect(Maybe).toBeDefined();
    expect(OutboxIntegrationEventPublisher).toBeDefined();
    expect(OutboxTaskScheduler).toBeDefined();
    expect(QueryBusBuilder).toBeDefined();
    expect(RegistryCommandBus).toBeDefined();
    expect(RegistryQueryBus).toBeDefined();
    expect(Result).toBeDefined();
    expect(TransactionalCommandBus).toBeDefined();
    expect(ValidationErrors).toBeDefined();
    expect(ValueObject).toBeDefined();
  });
});

describe('testing barrel exports all test utility classes', () => {
  it('exports all testing utilities', () => {
    expect(DeferredDomainEventBusSpy).toBeDefined();
    expect(InMemoryIntegrationEventOutboxRepository).toBeDefined();
    expect(InMemoryIntegrationEventPublisher).toBeDefined();
    expect(InMemoryRepository).toBeDefined();
    expect(InMemoryTaskOutboxRepository).toBeDefined();
    expect(InMemoryTaskScheduler).toBeDefined();
  });
});
