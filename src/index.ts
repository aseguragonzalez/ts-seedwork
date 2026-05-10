// Application — CQRS / Commands
export type { Command, CommandBus, CommandBusMiddleware, CommandHandler, ResultError } from './application/commands.js';
export { Result } from './application/commands.js';

// Application — CQRS / Queries
export type { Query, QueryBus, QueryBusMiddleware, QueryHandler } from './application/queries.js';
export { Maybe } from './application/queries.js';

// Application — Validation
export type { ValidationErrorDetail } from './application/validation.error.js';
export { ValidationErrors } from './application/validation.error.js';

// Application — Domain Events
export type { DomainEventBus } from './application/domain-event-bus.js';
export type { DomainEventHandler, DomainEventPublisher } from './application/domain-events.js';

// Application — Integration Events
export type { IntegrationEvent, IntegrationEventPublisher } from './application/integration-event.js';
export { BaseIntegrationEvent } from './application/integration-event.js';

// Application — Outbox
export type { OutboxRecord, OutboxRepository, OutboxStatus } from './application/outbox.js';

// Application — Background Tasks
export type { BackgroundTask, TaskBus, TaskHandler, TaskQueue, TaskStatus } from './application/background-task.js';

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
export { DomainEventFlushCommandBus } from './infrastructure/domain-event-flush-command-bus.js';
export { RegistryCommandBus } from './infrastructure/registry-command-bus.js';
export { TransactionalCommandBus } from './infrastructure/transactional-command-bus.js';
export { ValidationCommandBus } from './infrastructure/validation-command-bus.js';

// Infrastructure — Query Bus
export { QueryBusBuilder } from './infrastructure/query-bus-builder.js';
export { RegistryQueryBus } from './infrastructure/registry-query-bus.js';
export { ValidationQueryBus } from './infrastructure/validation-query-bus.js';

// Infrastructure — Repository
export { DomainEventPublishingRepository } from './infrastructure/domain-event-publishing-repository.js';
export { InMemoryRepository } from './infrastructure/in-memory-repository.js';

// Infrastructure — Integration Events / Outbox
export { InMemoryIntegrationEventPublisher } from './infrastructure/in-memory-integration-event-publisher.js';
export { InMemoryOutboxRepository } from './infrastructure/in-memory-outbox-repository.js';
export { OutboxIntegrationEventPublisher } from './infrastructure/outbox-integration-event-publisher.js';

// Infrastructure — Tasks
export { InMemoryTaskQueue } from './infrastructure/in-memory-task-queue.js';
export { RegistryTaskBus } from './infrastructure/registry-task-bus.js';
