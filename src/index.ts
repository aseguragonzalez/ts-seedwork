export const SEEDWORK_VERSION = '0.0.6';

// Application — CQRS
export type { Command, CommandBus, CommandHandler } from './application/commands.js';
export type { Query, QueryBus, QueryHandler, QueryResponse } from './application/queries.js';

// Application — Domain Events
export type { DomainEventBus, DomainEventHandler } from './application/domain-events.js';

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
export { DeferredDomainEventBus } from './infrastructure/deferred-domain-event-bus.js';
export { DomainEventFlushCommandBus } from './infrastructure/domain-event-flush-command-bus.js';
export { RegistryCommandBus } from './infrastructure/registry-command-bus.js';
export { TransactionalCommandBus } from './infrastructure/transactional-command-bus.js';

// Infrastructure — Query Bus
export { RegistryQueryBus } from './infrastructure/registry-query-bus.js';
