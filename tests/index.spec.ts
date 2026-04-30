import {
  AggregateRoot,
  BaseDomainEvent,
  CommandBusBuilder,
  DomainError,
  DomainEventPublishingRepository,
  Entity,
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
} from '../src/index.js';

describe('exports', () => {
  it('exports all public API classes', () => {
    expect(AggregateRoot).toBeDefined();
    expect(BaseDomainEvent).toBeDefined();
    expect(CommandBusBuilder).toBeDefined();
    expect(DomainError).toBeDefined();
    expect(DomainEventPublishingRepository).toBeDefined();
    expect(Entity).toBeDefined();
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
