# @aseguragonzalez/ts-seedwork

[![CI](https://github.com/aseguragonzalez/ts-seedwork/actions/workflows/ci.yml/badge.svg)](https://github.com/aseguragonzalez/ts-seedwork/actions/workflows/ci.yml)
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

Pre-release dist-tags are removed automatically when the pull request closes. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to publish one.

## How to use

- **[Component reference](docs/component-reference.md)** — every class, interface, and infrastructure component with usage examples.
- **[tests/fixtures/bank-account/](tests/fixtures/bank-account/)** — full working example exercising all building blocks end to end.

### 1. Define a domain aggregate

```typescript
import { AggregateRoot, BaseDomainEvent, TypedDomainEvent, ValueObject } from '@aseguragonzalez/ts-seedwork';

class AccountId extends ValueObject {
  constructor(public readonly value: string) {
    super();
  }
}

class AccountOpened extends BaseDomainEvent<{ accountId: string; balance: number }> {
  static create(accountId: string, balance: number) {
    return new AccountOpened({ accountId, balance });
  }
  private constructor(payload: { accountId: string; balance: number }) {
    super(payload);
  }
}

class BankAccount extends AggregateRoot<AccountId> {
  private constructor(
    id: AccountId,
    public readonly balance: number,
    events: ReadonlyArray<TypedDomainEvent<Record<string, unknown>>> = []
  ) {
    super(id, events);
  }

  static open(id: AccountId, initialBalance: number): BankAccount {
    const event = AccountOpened.create(id.value, initialBalance);
    return new BankAccount(id, initialBalance, [event]);
  }

  static reconstitute(id: AccountId, balance: number): BankAccount {
    return new BankAccount(id, balance); // no events — already published
  }
}
```

### 2. Implement a command handler

```typescript
import { Command, CommandHandler, ValidationErrorDetail, ValidationErrors } from '@aseguragonzalez/ts-seedwork';

class OpenAccountCommand implements Command {
  constructor(
    public readonly accountId: string,
    public readonly balance: number
  ) {}
  validate(): void {
    const errors: ValidationErrorDetail[] = [];
    if (this.balance < 0) errors.push({ code: 'INVALID_BALANCE', message: 'Balance cannot be negative' });
    if (errors.length > 0) throw new ValidationErrors(errors);
  }
}

class OpenAccountHandler implements CommandHandler<OpenAccountCommand> {
  constructor(private readonly repository: BankAccountRepository) {}

  async execute(command: OpenAccountCommand): Promise<void> {
    const id = new AccountId(command.accountId);
    const account = BankAccount.open(id, command.balance);
    await this.repository.save(account); // publishes AccountOpened automatically
  }
}
```

### 3. Assemble the bus

```typescript
import { CommandBusBuilder, DomainEventPublishingRepository } from '@aseguragonzalez/ts-seedwork';

const repository = new DomainEventPublishingRepository(new BankAccountRepositoryImpl(), myEventPublisher);

const bus = new CommandBusBuilder()
  .register(OpenAccountCommand, new OpenAccountHandler(repository))
  .withValidation() // outermost — validates before opening a transaction
  .withTransaction(unitOfWork)
  .build();

const result = await bus.dispatch(new OpenAccountCommand('acc-1', 1000));
if (result.isFail()) {
  console.error(result.errors);
}
```

## What's included

| Layer              | Components                                                                                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Domain**         | `Entity`, `AggregateRoot`, `ValueObject`, `BaseDomainEvent`, `Repository`, `UnitOfWork`, `DomainError`, `Logger`                                                                             |
| **Application**    | `Command`/`CommandBus`/`CommandHandler`, `Query`/`QueryBus`/`QueryHandler`, `Result`, `Maybe`, `DomainEventPublisher`, `DomainEventHandler`                                                  |
| **Infrastructure** | `RegistryCommandBus`, `RegistryQueryBus`, `TransactionalCommandBus`, `ValidationCommandBus`, `ValidationQueryBus`, `DomainEventPublishingRepository`, `CommandBusBuilder`, `QueryBusBuilder` |

## Built with

- **TypeScript** 6
- **Node.js** 22
- **Jest** 30 + **@swc/jest** for tests
- **ESLint** 10 for linting
- **Prettier** 3 for formatting
- **Husky** + **commitlint** for pre-commit hooks
- **semantic-release** for automated versioning and changelog

## Development

If you plan to contribute, read [CONTRIBUTING.md](CONTRIBUTING.md) for the full setup guide, architecture principles, and pull request process.

| Task              | Command                                                                               |
| ----------------- | ------------------------------------------------------------------------------------- |
| Install deps      | `npm ci`                                                                              |
| Full quality gate | `npm run lint && npm run format:check && npm run type:check && npm run test:coverage` |
| Tests             | `npm test`                                                                            |
| Tests (coverage)  | `npm run test:coverage`                                                               |
| Build             | `npm run build`                                                                       |

## Documentation

- [Component reference](docs/component-reference.md) — every class, interface, and infrastructure component with usage examples
- [Changelog](CHANGELOG.md)

## Requirements

- Node.js 22+
- TypeScript 6+

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

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
