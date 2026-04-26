# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm ci               # install deps + set up husky pre-commit hooks
npm run lint         # ESLint
npm run format:check # Prettier check
npm run type:check   # tsc --noEmit (no emit, full type checking)
npm test             # run all tests via Jest + @swc/jest
npm run build        # compile to dist/ via tsconfig.build.json
npm run clean        # remove dist/
```

Run a single test file:

```bash
npx jest tests/domain/aggregate-root.spec.ts
```

Full quality gate (lint + format + types + tests):

```bash
make check           # local
make docker-check    # Docker (no local Node required)
```

## Architecture

This is a DDD seedwork library (`@aseguragonzalez/seedwork`) published to GitHub Packages. It provides base classes and interfaces for building domain-driven TypeScript applications using CQRS.

### Layer structure

**`src/domain/`** — pure domain building blocks with no dependencies:

- `Entity` / `AggregateRoot` — base classes; `AggregateRoot` is immutable: `withEvent(event)` returns a new shallow clone (via `Object.create + Object.assign`), `getDomainEvents()` is a pure read with no side effects
- `ValueObject` — structural equality via deep comparison
- `TypedId` — branded identity wrapper
- `Repository<T>` / `UnitOfWork` — interfaces only (no implementations)
- `DomainError` / `ValueError` — typed error hierarchy

**`src/application/`** — CQRS contracts (interfaces only):

- `Command` / `CommandBus` / `CommandHandler`
- `Query` / `QueryBus` / `QueryHandler` / `QueryResponse`
- `DomainEventPublisher` (outbound port) / `DomainEventHandler` (inbound port)

**`src/infrastructure/`** — concrete bus implementations (decorators/adapters):

- `RegistryCommandBus` — maps command types to handlers via a registry
- `RegistryQueryBus` — same pattern for queries
- `TransactionalCommandBus` — decorator wrapping any `CommandBus` with `UnitOfWork` session/commit/rollback
- `ValidationCommandBus` — decorator that calls `command.validate()` before dispatch
- `DomainEventPublishingRepository` — decorator wrapping any `Repository`; calls `publisher.publish(entity.getDomainEvents())` after `save`
- `CommandBusBuilder` — fluent builder that composes the above in the correct fixed order

### Typical composition

```typescript
const repository = new DomainEventPublishingRepository(new BankAccountRepositoryImpl(), publisher);

const bus = new CommandBusBuilder()
  .register(OpenAccountCommand, new OpenAccountHandler(repository))
  .withValidation()
  .withTransaction(unitOfWork)
  .build();
```

Stack order enforced by the builder: `Validation → Transaction → Registry`. Handler pattern: load aggregate → call behavior method (returns new immutable instance) → `save(updated)`. Event publishing is handled transparently by `DomainEventPublishingRepository` — handlers have no knowledge of the event bus.

Reference fixture: `tests/fixtures/bank-account/` — complete BankAccount example (domain, application, infrastructure, tests).

### Module / import conventions

- Source uses ESM (`"type": "module"`), `NodeNext` module resolution
- All internal imports use `.js` extensions (even for `.ts` source files)
- Path alias `@seedwork` maps to `src/index.ts` in tests (via `moduleNameMapper`)
- Tests live in `tests/` mirroring `src/` structure; transpiled by `@swc/jest` (no tsc during test runs)
- `tsconfig.build.json` emits to `dist/`; `tsconfig.test.json` is used by the type-check step for test files
