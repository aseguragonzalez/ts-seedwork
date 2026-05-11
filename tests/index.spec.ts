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
  InMemoryIntegrationEventOutboxRepository,
  InMemoryIntegrationEventPublisher,
  InMemoryTaskOutboxRepository,
  InMemoryTaskScheduler,
  Maybe,
  QueryBusBuilder,
  RegistryCommandBus,
  RegistryQueryBus,
  Result,
  TransactionalCommandBus,
  ValidationCommandBus,
  ValidationErrors,
  ValidationQueryBus,
  ValueObject,
} from '@src';

describe('exports', () => {
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
    expect(InMemoryIntegrationEventPublisher).toBeDefined();
    expect(InMemoryIntegrationEventOutboxRepository).toBeDefined();
    expect(InMemoryTaskOutboxRepository).toBeDefined();
    expect(InMemoryTaskScheduler).toBeDefined();
    expect(Maybe).toBeDefined();
    expect(QueryBusBuilder).toBeDefined();
    expect(RegistryCommandBus).toBeDefined();
    expect(RegistryQueryBus).toBeDefined();
    expect(Result).toBeDefined();
    expect(TransactionalCommandBus).toBeDefined();
    expect(ValidationCommandBus).toBeDefined();
    expect(ValidationErrors).toBeDefined();
    expect(ValidationQueryBus).toBeDefined();
    expect(ValueObject).toBeDefined();
  });
});
