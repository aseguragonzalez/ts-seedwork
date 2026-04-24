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
| Throw `DomainError` or `ValueError` for domain violations      | Throw generic `Error` or framework exceptions from domain code |
| Name events in past tense (`MoneyDeposited`)                   | Name events like commands (`DepositMoney`)                     |
| Reference other aggregates by `TypedId` only                   | Hold object references to other aggregate roots                |
| Use primitives or simple DTOs at command/query port boundaries | Leak domain types through port interfaces when avoidable       |
| Stack buses: `Transactional → EventFlush → Registry`           | Flush events outside the transaction, or in the wrong order    |
| One public class per file; file name matches class name        | Put multiple unrelated classes in one file                     |

---

## Domain layer

### Entities

- Extend `Entity<ID>` with a `TypedId` subclass as the `ID` type parameter.
- Equality is by identity only — never compare entities by attributes.
- Do not expose mutable setters that bypass invariants.

### Value objects

- Extend `ValueObject`. All properties must be `readonly`.
- Validate in the constructor; throw `ValueError` on invalid state.
- Implement `equals` only if the default property-by-property comparison is insufficient — the base class handles primitives, `Date`, arrays, and nested `ValueObject`s.
- Static factories or named constructors are fine; keep constructors `private` or `protected`.

### Aggregates

- Extend `AggregateRoot<TypedId>`. Private constructor with static factory methods (`open`, `create`, `reconstitute`).
- Every behavior method returns a new instance — never mutates.
- Thread domain events explicitly through the constructor: `new MyAggregate(id, ...state, [...this.getDomainEvents(), newEvent])`.
- Use `withEvent` only for behaviors that record an event without changing other state.
- Expose only the root to the outside; internal entities and value objects are not shared directly.

### Domain events

- Extend `BaseDomainEvent`. Private constructor + `static create(...)` factory.
- `eventName` in past tense. Use a consistent format: `EntityName/EventName` or just `EventName`.
- `payload` must be serializable: primitives only. Serialize `TypedId` values to strings, `ValueObject` fields to their scalar values.
- Use `crypto.randomUUID()` for event `id`.

### Repositories

- Define repository interfaces in the domain layer, extending `Repository<ID, T>`.
- Implement in infrastructure.
- Do not add query methods that return DTOs or expose persistence details in the interface.

### Errors

- Use `DomainError` directly for general domain violations: `throw new DomainError('message', 'ERROR_CODE')`.
- Extend `DomainError` for named, reusable error types when the distinction has meaning in the consuming code (e.g. `InsufficientFundsError`).
- Use `ValueError` for invalid value object or typed-id state.
- Do not catch infrastructure exceptions in the domain layer.

---

## Application layer

### Commands and handlers

- One command class per write use case implementing `Command`.
- One handler implementing `CommandHandler<TCommand>`.
- Handler pattern: `load aggregate → call domain method(s) → publish getDomainEvents() → save`.
- Use primitives in commands when the handler constructs domain objects internally. This keeps the port boundary free of domain type coupling.
- Do not put business logic in the handler — only orchestration.

### Queries and handlers

- One query class per read use case implementing `Query`.
- One handler implementing `QueryHandler<TQuery, TResult>` returning a `QueryResponse` subtype.
- Handlers are read-only: no commands dispatched, no state changed.
- Do not return domain entities — return `QueryResponse` subtypes with primitive or DTO fields.

### Domain event handlers

- Implement `DomainEventHandler<TEvent>`.
- Subscribe by `eventName` string via `DomainEventBus.subscribe`.
- One concern per handler (e.g. update projection, send notification — these are separate handlers).
- Design for idempotency when the bus may redeliver events.

---

## Infrastructure layer

- Implement `Repository` and `UnitOfWork` here, not in domain.
- Wire `RegistryCommandBus` and `RegistryQueryBus` with handlers.
- Compose command buses in the canonical order: `TransactionalCommandBus → DomainEventFlushCommandBus → RegistryCommandBus`.
- Use `DeferredDomainEventBus` for monolithic single-DB applications. Subscribe event handlers before the first command is dispatched.
- Do not put domain or application use-case logic in infrastructure.

---

## Naming conventions

| Artifact                 | Convention                               | Example                                    |
| ------------------------ | ---------------------------------------- | ------------------------------------------ |
| Aggregate / Entity class | `PascalCase` noun                        | `BankAccount`, `Transaction`               |
| `TypedId` subclass       | `<EntityName>Id`                         | `BankAccountId`                            |
| Value object             | `PascalCase` noun                        | `Money`, `EmailAddress`                    |
| Domain event             | `PascalCase` past tense                  | `MoneyDeposited`, `AccountOpened`          |
| Command                  | `PascalCase` verb phrase                 | `DepositMoney`, `OpenAccount`              |
| Query                    | `Get<Noun>` or `Find<Noun>`              | `GetBalance`, `FindActiveAccounts`         |
| Command / query handler  | `<UseCaseName>Handler`                   | `DepositMoneyHandler`, `GetBalanceHandler` |
| Repository interface     | `<Aggregate>Repository`                  | `BankAccountRepository`                    |
| Concrete error class     | `<Context>Error` extending `DomainError` | `InsufficientFundsError`                   |
| Event handler            | `<EventName>Handler` or by concern       | `UpdateBalanceProjectionHandler`           |

---

## File and folder structure

Recommended layout for a project consuming this package:

```
src/
├── <bounded-context>/
│   ├── domain/
│   │   ├── <aggregate>.ts                  # AggregateRoot subclass
│   │   ├── <aggregate>-id.ts               # TypedId subclass
│   │   ├── value-objects/
│   │   │   └── <value-object>.ts
│   │   ├── events/
│   │   │   └── <event-name>.ts             # BaseDomainEvent subclass
│   │   └── <aggregate>.repository.ts       # Repository interface
│   ├── application/
│   │   └── <use-case>/
│   │       ├── <use-case>.command.ts       # or .query.ts
│   │       ├── <use-case>.handler.ts
│   │       └── <use-case>.response.ts      # QueryResponse subtype (queries only)
│   └── infrastructure/
│       └── <impl>-<aggregate>.repository.ts
└── shared/
    └── infrastructure/
        └── buses.ts                        # Bus composition and wiring
```

One class per file. File name matches the exported class name in `kebab-case`.
