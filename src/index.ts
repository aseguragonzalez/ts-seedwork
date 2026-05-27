// Application — CQRS / Commands
export type { CommandBus, CommandBusMiddleware, CommandHandler, ResultError } from './application/commands.js';
export { Command } from './application/commands.js';
export { Result } from './application/commands.js';

// Application — CQRS / Queries
export type { QueryBus, QueryBusMiddleware, QueryHandler } from './application/queries.js';
export { Query } from './application/queries.js';
export { Maybe } from './application/queries.js';

// Application — Validation
export type { ValidationErrorDetail } from './application/validation.error.js';
export { ValidationErrors } from './application/validation.error.js';

// Application — Domain Events
export type {
  DomainEventBus,
  DomainEventBusPublisher,
  DomainEventBusSubscriber,
} from './application/domain-event-bus.js';
export type { DomainEventHandler } from './application/domain-event-bus.js';

// Application — Integration Events
export type {
  IntegrationEvent,
  IntegrationEventHandler,
  IntegrationEventPublisher,
} from './application/integration-event.js';
export { BaseIntegrationEvent } from './application/integration-event.js';

// Application — Background Tasks
export type { BackgroundTask, TaskHandler, TaskScheduler } from './application/background-task.js';
export { BaseBackgroundTask } from './application/background-task.js';

// Shared — Logger
export type { Logger } from './shared/logger.js';

// Domain — Building blocks
export { AggregateRoot } from './domain/aggregate-root.js';
export type { DomainEvent, TypedDomainEvent } from './domain/domain-event.js';
export { BaseDomainEvent } from './domain/domain-event.js';
export { Entity } from './domain/entity.js';
export { ValueObject } from './domain/value-object.js';

// Domain — Repository
export type { Repository } from './domain/repository.js';

// Domain — Unit of Work
export type { UnitOfWork } from './domain/unit-of-work.js';

// Domain — Errors
export { DomainError } from './domain/domain-error.js';

// Infrastructure — Command Bus
export { CommandBusBuilder } from './infrastructure/command-bus-builder.js';
export { DeferredDomainEventBus } from './infrastructure/deferred-domain-event-bus.js';
export { DomainEventCoordinatorCommandBus } from './infrastructure/domain-event-coordinator-command-bus.js';
export { RegistryCommandBus } from './infrastructure/registry-command-bus.js';
export { TransactionalCommandBus } from './infrastructure/transactional-command-bus.js';

// Infrastructure — Query Bus
export { QueryBusBuilder } from './infrastructure/query-bus-builder.js';
export { RegistryQueryBus } from './infrastructure/registry-query-bus.js';

// Infrastructure — Repository
export { DomainEventPublishingRepository } from './infrastructure/domain-event-publishing-repository.js';

// Infrastructure — Outbox
export type {
  IntegrationEventOutboxRecord,
  IntegrationEventOutboxRepository,
  OutboxStatus,
  TaskOutboxRecord,
  TaskOutboxRepository,
} from './infrastructure/outbox.js';
export { OutboxIntegrationEventPublisher, OutboxTaskScheduler } from './infrastructure/outbox.js';
