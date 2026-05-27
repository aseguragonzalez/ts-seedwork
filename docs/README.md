# @aseguragonzalez/ts-seedwork — Documentation

This package provides DDD and hexagonal architecture building blocks for TypeScript/Node applications.

## Contents

- [Component reference](component-reference.md) — Every interface, base class, and infrastructure component.
- [Coding standards](coding-standards.md) — Conventions aligned with DDD and Clean Architecture, with do/don't guidelines.
- [Best practices](best-practices.md) — Design rules for hexagonal architecture, domain components, CQRS, and the domain/integration/background-task event model.
- [Architecture](architecture.md) — Service anatomy, infrastructure mechanisms (outbox, UoW, idempotency, retry/DLQ), and observability.

## Complete working example

A full, self-contained example that exercises all building blocks:

- **[examples/bank-account/](examples/bank-account/)** — Domain (aggregate root, value objects, domain events, repository interface), application (commands, queries, handlers), and infrastructure (in-memory repository). Use it as a reference when building a new bounded context.

## Quick links

- [Domain layer](component-reference.md#domain-layer) — Entity, AggregateRoot, ValueObject, DomainEvent, Repository, UnitOfWork, Errors.
- [Application layer](component-reference.md#application-layer) — Commands, Queries, Result, Maybe, Domain Events.
- [Infrastructure layer](component-reference.md#infrastructure-layer) — Bus implementations, decorators, builders.
