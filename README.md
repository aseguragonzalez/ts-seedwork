# @aseguragonzalez/ts-seedwork

[![CI](https://github.com/aseguragonzalez/ts-seedwork/actions/workflows/ci.yml/badge.svg)](https://github.com/aseguragonzalez/ts-seedwork/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/aseguragonzalez/ts-seedwork/branch/main/graph/badge.svg)](https://codecov.io/gh/aseguragonzalez/ts-seedwork)
[![npm version](https://img.shields.io/npm/v/@aseguragonzalez/ts-seedwork.svg)](https://www.npmjs.com/package/@aseguragonzalez/ts-seedwork)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js >=22](https://img.shields.io/node/v/%40aseguragonzalez%2Fts-seedwork)](https://nodejs.org/)

DDD and CQRS building blocks for TypeScript/Node applications.

Provides base classes and interfaces for the domain, application, and infrastructure layers of a domain-driven design. Zero runtime dependencies.

## Goal

- **Unify patterns:** All domain and application code extends or implements SeedWork abstractions, keeping the codebase consistent and predictable.
- **Keep the domain pure:** Domain types depend only on SeedWork domain types; no framework or infrastructure in the domain layer.
- **Clear boundaries:** Application use cases are expressed as command handlers (writes) and query handlers (reads), with primitives-only DTOs at the port boundary.

## Installation

### From npm

```bash
npm install @aseguragonzalez/ts-seedwork
```

### From GitHub Packages

Add a `.npmrc` to your project:

```text
@aseguragonzalez:registry=https://npm.pkg.github.com
```

Then authenticate with a personal access token with `read:packages` and install:

```bash
npm install @aseguragonzalez/ts-seedwork
```

### Pre-release versions

Pre-release builds are published from pull request branches for integration testing. Install by tag:

```bash
npm install @aseguragonzalez/ts-seedwork@pr-42
```

Or by exact version (shown in the workflow's Job Summary after publishing):

```bash
npm install @aseguragonzalez/ts-seedwork@0.0.0-pr-42.7
```

Pre-release dist-tags are removed automatically when the pull request closes. See [CONTRIBUTING.md](https://github.com/aseguragonzalez/ts-seedwork/blob/main/.github/CONTRIBUTING.md) for how to publish one.

## How to use

See [Getting Started](docs/getting-started.md) for a step-by-step walkthrough: define a value object, build an aggregate root, create a command handler, and wire a bus.

The [Component Reference](docs/component-reference.md) covers every class and interface in detail. A complete working example lives in [`docs/examples/bank-account/`](docs/examples/bank-account/).

## What's included

| Layer              | Components                                                                                                                                                                                                                                                                                                |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Shared**         | `Logger`                                                                                                                                                                                                                                                                                                  |
| **Domain**         | `Entity`, `AggregateRoot`, `ValueObject`, `BaseDomainEvent`, `Repository`, `UnitOfWork`, `DomainError`                                                                                                                                                                                                    |
| **Application**    | `Command`/`CommandBus`/`CommandHandler`, `Query`/`QueryBus`/`QueryHandler`, `Result`, `Maybe`, `DomainEventBusPublisher`/`DomainEventBusSubscriber`/`DomainEventBus`, `DomainEventHandler`, `IntegrationEvent`/`IntegrationEventHandler`/`IntegrationEventPublisher`, `BackgroundTask`/`TaskScheduler`    |
| **Infrastructure** | `RegistryCommandBus`, `RegistryQueryBus`, `TransactionalCommandBus`, `ValidationCommandBus`, `ValidationQueryBus`, `DomainEventCoordinatorCommandBus`, `DeferredDomainEventBus`, `DomainEventPublishingRepository`, `InMemoryRepository`, `InMemoryTaskScheduler`, `CommandBusBuilder`, `QueryBusBuilder` |

## Built with

- **TypeScript** 6
- **Node.js** 22
- **Jest** 30 + **@swc/jest** for tests
- **ESLint** 10 for linting
- **Prettier** 3 for formatting
- **Husky** + **commitlint** for pre-commit hooks
- **semantic-release** for automated versioning and changelog

## Development

If you plan to contribute, read [CONTRIBUTING.md](.github/CONTRIBUTING.md) for the full setup guide, architecture principles, and pull request process.

| Task              | Command                                                                               |
| ----------------- | ------------------------------------------------------------------------------------- |
| Install deps      | `npm ci`                                                                              |
| Full quality gate | `npm run lint && npm run format:check && npm run type:check && npm run test:coverage` |
| Tests             | `npm test`                                                                            |
| Tests (coverage)  | `npm run test:coverage`                                                               |
| Build             | `npm run build`                                                                       |

## Documentation

Comprehensive guides are available in the [`docs/`](docs/) directory:

- [Getting Started](docs/getting-started.md)
- [Component Reference](docs/component-reference.md)
- [Best Practices](docs/best-practices.md)
- [Coding Standards](docs/coding-standards.md)

A complete [Bank Account example](docs/examples/bank-account/) demonstrates all patterns end-to-end.

## Requirements

- Node.js 22+
- TypeScript 6+

## Contributing

See [CONTRIBUTING.md](https://github.com/aseguragonzalez/ts-seedwork/blob/main/.github/CONTRIBUTING.md).

## References

This package draws on the following literature and on the experience of building solid, scalable, and maintainable systems in different stacks (PHP, C#, Python, TypeScript).

- Eric Evans, _Domain-Driven Design: Tackling Complexity in the Heart of Software_ [1]
- Vaughn Vernon, _Implementing Domain-Driven Design_ [2]
- Robert C. Martin, _Clean Architecture: A Craftsman's Guide to Software Structure and Design_ [3]
- .NET Microservices: Architecture for Containerized .NET Applications [4]
- Architecture Patterns with Python, Harry Percival & Bob Gregory [5]

## License

[MIT](LICENSE)

[1]: https://www.amazon.es/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215
[2]: https://www.amazon.es/Implementing-Domain-Driven-Design-Vaughn-Vernon/dp/0321834577
[3]: https://www.amazon.es/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164
[4]: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/
[5]: https://www.oreilly.com/library/view/architecture-patterns-with/9781492052197/
