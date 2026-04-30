# GitHub Copilot Instructions

This is `@aseguragonzalez/ts-seedwork` — a zero-dependency DDD/CQRS seedwork library for TypeScript/Node. It provides base classes and interfaces for domain, application, and infrastructure layers. Published to npm and GitHub Packages.

---

## Architecture

Three layers with a strict inward dependency rule: infrastructure → application → domain. Inner layers never import from outer ones.

### `src/domain/` — pure building blocks, zero external dependencies

| Component                   | Role                                                                                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `Entity<ID>`                | Base entity. Identity equality via `id`.                                                                                                        |
| `AggregateRoot<ID>`         | Extends `Entity`. Accumulates domain events. Behavior methods return **new instances** — never mutate `this`.                                   |
| `ValueObject`               | Structural equality. All properties must be `readonly`.                                                                                         |
| `BaseDomainEvent<TPayload>` | Abstract base for domain events. Private constructor + `static create(...)` factory. Past-tense names. Serializable payloads (primitives only). |
| `Repository<ID, T>`         | Interface only. `findById`, `save`, `deleteById`.                                                                                               |
| `UnitOfWork`                | Interface only. `createSession`, `commit`, `rollback`.                                                                                          |
| `DomainError`               | Abstract base for domain failures. Extend per failure case.                                                                                     |
| `Logger`                    | Cross-cutting logging port. `debug`, `info`, `warn`, `error`, `fatal`.                                                                          |

### `src/application/` — CQRS contracts, interfaces only

| Component                                   | Role                                                                                |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| `Command` / `CommandHandler` / `CommandBus` | Write side. `dispatch` returns `Result`.                                            |
| `Query` / `QueryHandler` / `QueryBus`       | Read side. `ask` returns `Maybe<T>`.                                                |
| `Result`                                    | Command outcome. `Result.ok()` / `Result.fail(errors)`.                             |
| `Maybe<T>`                                  | Query outcome. `Maybe.just(value)` / `Maybe.nothing()`.                             |
| `DomainEventPublisher`                      | Outbound port. Do not inject into handlers — use `DomainEventPublishingRepository`. |
| `DomainEventHandler<TEvent>`                | Inbound port. One class per event type.                                             |

### `src/infrastructure/` — concrete implementations

| Component                                     | Role                                                                           |
| --------------------------------------------- | ------------------------------------------------------------------------------ |
| `RegistryCommandBus` / `RegistryQueryBus`     | Registry-based routing.                                                        |
| `ValidationCommandBus` / `ValidationQueryBus` | Decorator. Calls `validate()` before dispatch.                                 |
| `TransactionalCommandBus`                     | Decorator. Wraps dispatch in a `UnitOfWork`.                                   |
| `DomainEventPublishingRepository`             | Decorator. Calls `publisher.publish(entity.getDomainEvents())` after `save`.   |
| `CommandBusBuilder` / `QueryBusBuilder`       | Fluent builders. Declaration order = stack order (first declared = outermost). |

---

## Design invariants — never violate these

**CQS is non-negotiable.** Commands return nothing (`Promise<void>` in handlers). Queries return data. Do not blend reads and writes in a single operation.

**Aggregate behavior methods return a new instance.** Pass the new event to the constructor — never mutate `this` for convenience. The pattern:

```typescript
deposit(amount: Money): BankAccount {
  const event = MoneyDeposited.create(this.id.value, amount);
  return new BankAccount(this.id, this.balance.add(amount), [...this.getDomainEvents(), event]);
}
```

**`getDomainEvents()` is a pure read.** No side effects. Calling it twice returns the same events. Never clear events manually.

**Reconstitute without events.** When loading an aggregate from persistence, use a `static reconstitute(...)` factory that passes no events — those have already been published:

```typescript
static reconstitute(id: BankAccountId, balance: Money): BankAccount {
  return new BankAccount(id, balance); // no events
}
```

**Handler pattern:** load aggregate → call behavior method → `save(updated)`. Event publishing is transparent via `DomainEventPublishingRepository` — handlers have no knowledge of the event bus.

**`DomainError` maps to `Result.fail`.** Expected domain failures (business rule violations) are modeled as `DomainError` subclasses and surface as `Result.fail` at the command bus boundary. Unexpected exceptions (infrastructure, timeouts) propagate as thrown errors.

**Bus stack order.** With `CommandBusBuilder`, first declared = outermost. For correct behaviour, declare `.withValidation()` before `.withTransaction()` so validation errors never open a transaction:

```typescript
const bus = new CommandBusBuilder()
  .register(OpenAccountCommand, new OpenAccountHandler(repo))
  .withValidation() // outermost
  .withTransaction(uow)
  .build();
```

---

## Code conventions

### Imports

- ESM source (`"type": "module"`), `NodeNext` module resolution.
- All internal imports use `.js` extensions even though source files are `.ts`:
  ```typescript
  import { Entity } from './entity.js';
  ```
- Tests use the `@seedwork` alias (`moduleNameMapper` in Jest config) pointing to `src/index.ts`.

### Naming

| Element       | Convention                                                 |
| ------------- | ---------------------------------------------------------- |
| Domain events | Past tense noun phrase — `AccountOpened`, `MoneyDeposited` |
| Handlers      | `<UseCase>Handler` — `OpenAccountHandler`                  |
| Commands      | Imperative noun phrase — `OpenAccountCommand`              |
| Queries       | Interrogative noun phrase — `GetBalanceQuery`              |
| Domain errors | Descriptive, `Error` suffix — `InsufficientFundsError`     |
| Value objects | Noun — `Money`, `AccountId`                                |

### Comments

Write no comments by default. Add one only when the **why** is non-obvious (hidden constraint, invariant, workaround). Never explain what the code does — well-named identifiers do that.

---

## Testing

- Tests live in `tests/` mirroring `src/`. A test for `src/domain/entity.ts` goes in `tests/domain/entity.spec.ts`.
- Transpiled by `@swc/jest` — no `tsc` during test runs.
- Reference fixture: `tests/fixtures/bank-account/` — complete example exercising all building blocks end to end. Use it as a template for new examples.
- When adding a component, add a spec at the matching path.
- When fixing a bug, add a regression test that fails before the fix.

```bash
npm test                                          # full suite
npx jest tests/domain/aggregate-root.spec.ts     # single file
```

---

## Toolchain

| Tool                | Version | Role                                                  |
| ------------------- | ------- | ----------------------------------------------------- |
| TypeScript          | 6.x     | Compiler. `NodeNext` module resolution.               |
| Jest + `@swc/jest`  | 30.x    | Test runner. SWC transpiles — no `tsc` in tests.      |
| ESLint              | 10.x    | Linting. Flat config in `eslint.config.js`.           |
| Prettier            | 3.x     | Formatting.                                           |
| Husky + lint-staged | —       | Pre-commit: lint + format staged files.               |
| semantic-release    | —       | Automated versioning and changelog on `main`.         |
| commitlint          | —       | Conventional Commits enforcement (local, pre-commit). |

Full quality gate:

```bash
npm run lint && npm run format:check && npm run type:check && npm test
```

---

## Release and versioning

**Never edit `package.json` version manually.** semantic-release manages it automatically on push to `main`.

### PR title is the version signal

This repository uses **squash merge**. The PR title becomes the single commit on `main`. semantic-release reads it to calculate the version bump:

| PR title type                        | Version bump |
| ------------------------------------ | ------------ |
| `fix:`                               | patch        |
| `feat:`                              | minor        |
| `feat!:` or `BREAKING CHANGE` footer | major        |

The CI validates the PR title format automatically (`amannn/action-semantic-pull-request`). Always write PR titles as:

```
<type>(optional scope): <short description>
```

Valid types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`, `ci`.

### API surface changes require a matching commit type

The CI diffs `dist/*.d.ts` against `main`. If the public API changed, the PR title must reflect the severity:

| API change                                       | Required type |
| ------------------------------------------------ | ------------- |
| New export, added optional property or parameter | `feat:`       |
| Removed export, changed or removed signature     | `feat!:`      |

### Pre-release from a PR branch

To publish a testable build for integration testing: GitHub Actions → **Pre-release** → Run workflow → select branch → enter `pr-{number}` (e.g. `pr-42`). The dist-tag is cleaned up automatically when the PR closes.

```bash
npm install @aseguragonzalez/ts-seedwork@pr-42
```
