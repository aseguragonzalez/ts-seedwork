export const SEEDWORK_VERSION = '0.0.7';

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
export type { DomainEventHandler, DomainEventPublisher } from './application/domain-events.js';

// Application — Logger
export type { Logger } from './application/logger.js';

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
export { RegistryCommandBus } from './infrastructure/registry-command-bus.js';
export { TransactionalCommandBus } from './infrastructure/transactional-command-bus.js';
export { ValidationCommandBus } from './infrastructure/validation-command-bus.js';

// Infrastructure — Query Bus
export { QueryBusBuilder } from './infrastructure/query-bus-builder.js';
export { RegistryQueryBus } from './infrastructure/registry-query-bus.js';
export { ValidationQueryBus } from './infrastructure/validation-query-bus.js';

// Infrastructure — Repository
export { DomainEventPublishingRepository } from './infrastructure/domain-event-publishing-repository.js';
