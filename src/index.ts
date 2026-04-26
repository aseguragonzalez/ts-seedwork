export const SEEDWORK_VERSION = '0.0.7';

// Application — ApplicationService
export type { ApplicationRequest, ApplicationService } from './application/application-service.js';

// Application — CQRS / Commands
export type { Command, CommandBus, CommandHandler, ResultError } from './application/commands.js';
export { Result } from './application/commands.js';

// Application — CQRS / Queries
export type { Query, QueryBus, QueryHandler } from './application/queries.js';
export { Maybe } from './application/queries.js';

// Application — Validation
export type { ValidationErrorDetail } from './application/validation.error.js';
export { ValidationErrors } from './application/validation.error.js';

// Application — Domain Events
export type { DomainEventHandler, DomainEventPublisher } from './application/domain-events.js';

// Domain — Building blocks
export { AggregateRoot } from './domain/aggregate-root.js';
export type { DomainEvent } from './domain/domain-event.js';
export { BaseDomainEvent } from './domain/domain-event.js';
export { Entity } from './domain/entity.js';
export { TypedId } from './domain/typed-id.js';
export { ValueObject } from './domain/value-object.js';

// Domain — Repository
export type { Repository } from './domain/repository.js';

// Domain — Unit of Work
export type { UnitOfWork } from './domain/unit-of-work.js';

// Domain — Errors
export { DomainError, ValueError } from './domain/errors/index.js';

// Cross-cutting
export type { Logger } from './logger.js';

// Infrastructure — Command Bus
export { CommandBusBuilder } from './infrastructure/command-bus-builder.js';
export { RegistryCommandBus } from './infrastructure/registry-command-bus.js';
export { TransactionalCommandBus } from './infrastructure/transactional-command-bus.js';
export { ValidationCommandBus } from './infrastructure/validation-command-bus.js';

// Infrastructure — Repository
export { DomainEventPublishingRepository } from './infrastructure/domain-event-publishing-repository.js';

// Infrastructure — Query Bus
export { RegistryQueryBus } from './infrastructure/registry-query-bus.js';
export { ValidationQueryBus } from './infrastructure/validation-query-bus.js';
