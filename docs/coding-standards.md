# Coding Standards

These standards apply to projects built on top of this package.

## TypeScript baseline

- `strict: true` always — no `noImplicitAny` bypass, no `as any` in domain or application layers.
- All domain properties `readonly`. Value objects and aggregate state fields must be immutable.
- ESM imports with `.js` extensions (`import { Foo } from './foo.js'`) — required for Node `"moduleResolution": "NodeNext"`.
- No `any` in domain or application layers. Infrastructure may use it only at adapter boundaries (e.g. ORM result rows).

---

## Do and Don't — Overview

| Do                                                             | Don't                                                          |
| -------------------------------------------------------------- | -------------------------------------------------------------- |
| Keep domain free of framework and infrastructure imports       | Import framework types, ORMs, or HTTP in the domain layer      |
| One use case = one command/query + one handler                 | Put multiple use cases in a single handler                     |
| Return new aggregate instances from behavior methods           | Mutate aggregate state in place                                |
| Throw a `DomainError` subclass for domain violations           | Throw generic `Error` or framework exceptions from domain code |
| Name events in past tense (`MoneyDeposited`)                   | Name events like commands (`DepositMoney`)                     |
| Reference other aggregates by their ID value object only       | Hold object references to other aggregate roots                |
| Use primitives or simple DTOs at command/query port boundaries | Leak domain types through port interfaces when avoidable       |
| Stack buses: `Validation → Transactional → Registry`           | Open a transaction before validating the command               |
| One public class per file; file name matches class name        | Put multiple unrelated classes in one file                     |

---

## Domain layer

### Entities

- Extend `Entity<ID>` using a `ValueObject` subclass as the `ID` type parameter.
- Equality is by identity only — never compare entities by attributes.
- Do not expose mutable setters that bypass invariants.

### Value objects

- Extend `ValueObject`. All properties must be `readonly`.
- Validate in the constructor; throw a `DomainError` subclass on invalid state.
- The base class handles `equals` for primitives, `Date`, arrays, and nested `ValueObject`s — override only when the default comparison is insufficient.
- Static factories or named constructors are fine; keep constructors `private` or `protected`.

### Aggregates

- Extend `AggregateRoot<ID>`. Private constructor with static factory methods (`open`, `create`, `reconstitute`).
- Every behavior method returns a new instance — never mutates.
- Thread domain events explicitly through the constructor: `new MyAggregate(id, ...state, [...this.getDomainEvents(), newEvent])`.
- Expose only the root to the outside; internal entities and value objects are not shared directly.

### Domain events

- Extend `BaseDomainEvent<TPayload>`. Private constructor + `static create(...)` factory.
- Name events in past tense (`AccountOpened`, `MoneyDeposited`).
- `payload` must be serializable: primitives only. Serialize ID and value object fields to their scalar values.

### Repositories

- Define repository interfaces in the domain layer, extending `Repository<ID, T>`.
- Implement in infrastructure.
- Do not add query methods that return DTOs or expose persistence details in the interface.

### Errors

- `DomainError` is `abstract` — always extend it with a named subclass: `class InsufficientFundsError extends DomainError { ... }`.
- The class name carries the ubiquitous language; `code` carries the external contract identifier for API mapping.
- Do not catch infrastructure exceptions in the domain layer.

---

## Application layer

### Commands and handlers

- One command class per write use case implementing `Command`.
- One handler implementing `CommandHandler<TCommand>`.
- Handler pattern: load aggregate → call domain method(s) → save. Event publishing is handled transparently by `DomainEventPublishingRepository` — do not publish events inside handlers.
- Use primitives in commands when the handler constructs domain objects internally. This keeps the port boundary free of domain type coupling.
- Do not put business logic in the handler — only orchestration.

### Queries and handlers

- One query class per read use case implementing `Query`.
- One handler implementing `QueryHandler<TQuery, TResult>` returning a plain TypeScript interface or class — never a domain entity.
- Handlers are read-only: no commands dispatched, no state changed.

### Domain event handlers

- Implement `DomainEventHandler<TEvent>`.
- One concern per handler (e.g. update projection, send notification — these are separate handlers).
- Design for idempotency when the bus may redeliver events.
- Wiring (routing event types to handlers) is the responsibility of the consuming project's composition root — it is not prescribed by this package.

---

## Infrastructure layer

- Implement `Repository` and `UnitOfWork` here, not in domain.
- Wire `RegistryCommandBus` and `RegistryQueryBus` with handlers via `.register(...)`.
- Compose command buses using `CommandBusBuilder` in the canonical order: `.withValidation()` before `.withTransaction()`.
- Wrap the repository with `DomainEventPublishingRepository` to publish events transparently after `save`.
- Do not put domain or application use-case logic in infrastructure.

---

## Naming conventions

| Artifact                | Convention                            | Example                                       |
| ----------------------- | ------------------------------------- | --------------------------------------------- |
| Aggregate / Entity      | `PascalCase` noun                     | `BankAccount`, `Transaction`                  |
| ID value object         | `<EntityName>Id`                      | `BankAccountId`                               |
| Value object            | `PascalCase` noun                     | `Money`, `EmailAddress`                       |
| Domain event            | `PascalCase` past tense               | `MoneyDeposited`, `AccountOpened`             |
| Command                 | `PascalCase` verb phrase + `Command`  | `DepositMoneyCommand`, `OpenAccountCommand`   |
| Query                   | `Get<Noun>Query` or `Find<Noun>Query` | `GetBalanceQuery`, `FindActiveAccountsQuery`  |
| Command / query handler | `<UseCaseName>Handler`                | `DepositMoneyHandler`, `GetBalanceHandler`    |
| Repository interface    | `<Aggregate>Repository`               | `BankAccountRepository`                       |
| Domain error class      | `<Context>Error`                      | `InsufficientFundsError`                      |
| Domain event handler    | `On<EventName>` or by concern         | `OnMoneyDeposited`, `UpdateBalanceProjection` |

---

## File and folder structure

Recommended layout for a project consuming this package:

```
src/
├── <bounded-context>/
│   ├── domain/
│   │   ├── <aggregate>.ts                  # AggregateRoot subclass
│   │   ├── <aggregate>-id.ts               # ValueObject subclass used as aggregate ID
│   │   ├── value-objects/
│   │   │   └── <value-object>.ts
│   │   ├── events/
│   │   │   └── <event-name>.ts             # BaseDomainEvent subclass
│   │   └── <aggregate>.repository.ts       # Repository interface
│   ├── application/
│   │   └── <use-case>/
│   │       ├── <use-case>.command.ts       # or .query.ts
│   │       ├── <use-case>.handler.ts
│   │       └── <use-case>.response.ts      # plain TS interface (queries only)
│   └── infrastructure/
│       └── <impl>-<aggregate>.repository.ts
└── shared/
    └── infrastructure/
        └── buses.ts                        # Bus composition and wiring
```

One class per file. File name matches the exported class name in `kebab-case`.
