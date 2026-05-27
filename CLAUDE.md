# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm ci                   # install deps + set up husky pre-commit hooks
npm run lint             # ESLint
npm run format:check     # Prettier check
npm run type:check       # tsc --noEmit (no emit, full type checking)
npm test                 # run all tests via Jest + @swc/jest
npm run test:coverage    # run tests with coverage (enforces thresholds)
npm run build            # compile to dist/ via tsconfig.build.json
npm run clean            # remove dist/
```

Run a single test file:

```bash
npx jest tests/domain/aggregate-root.spec.ts
```

Full quality gate (lint + format + types + tests + coverage):

```bash
npm run lint && npm run format:check && npm run type:check && npm run test:coverage
```

## Release and versioning

Releases are fully automated via semantic-release on push to `main`. **Never edit the version in `package.json` manually.**

### PR title is the version signal

This repository uses **squash merge**. The PR title is the only commit that lands on `main` and the input semantic-release uses to calculate the version bump. Always write PR titles in Conventional Commits format:

```
<type>(optional scope): <short description>
```

| PR title type                        | Version bump |
| ------------------------------------ | ------------ |
| `fix:`                               | patch        |
| `feat:`                              | minor        |
| `feat!:` or `BREAKING CHANGE` footer | major        |

### API surface changes require matching commit type

The CI diffs `dist/*.d.ts` against `main`. If the public API changed, the PR title must reflect the severity — a `fix:` title on a PR that removes an export will fail the check.

| API change                                   | Minimum required type |
| -------------------------------------------- | --------------------- |
| New export, added optional property/param    | `feat:`               |
| Removed export, changed or removed signature | `feat!:`              |

### Pre-release workflow

To publish a testable build from a PR branch: GitHub Actions → **Pre-release** → Run workflow → select branch → enter `pr-{number}` as identifier. Pre-release versions are kept permanently on the registry.

## Architecture

This is a DDD seedwork library (`@aseguragonzalez/ts-seedwork`) published to npm and GitHub Packages. It provides base classes and interfaces for building domain-driven TypeScript applications using CQRS.

### Layer structure

**`src/shared/`** — cross-cutting contracts, usable by any layer:

- `Logger` — logging port; inject into handlers or infrastructure implementations

**`src/domain/`** — pure domain building blocks with no dependencies:

- `Entity` / `AggregateRoot` — base classes; `AggregateRoot` stores domain events, `getDomainEvents()` is a pure read with no side effects
- `ValueObject` — structural equality via deep comparison
- `Repository<T>` / `UnitOfWork` — interfaces only (no implementations)
- `DomainError` — base for domain failures

**`src/application/`** — CQRS contracts (interfaces only):

- `Command` / `CommandBus` / `CommandHandler`; `CommandBus.dispatch` returns `Result`
- `Query` / `QueryBus` / `QueryHandler`; `QueryBus.ask` returns `Maybe<T>`
- `Result` / `Maybe` — value types for command and query outcomes
- `DomainEventPublisher` (outbound port) / `DomainEventHandler` (inbound port)

**`src/infrastructure/`** — concrete bus implementations (decorators/adapters):

- `RegistryCommandBus` — maps command types to handlers via a registry
- `RegistryQueryBus` — same pattern for queries
- `TransactionalCommandBus` — decorator wrapping any `CommandBus` with `UnitOfWork` session/commit/rollback
- `DomainEventPublishingRepository` — decorator wrapping any `Repository`; calls `publisher.publish(entity.getDomainEvents())` after `save`
- `CommandBusBuilder` / `QueryBusBuilder` — fluent builders; declaration order determines stack (first declared = outermost)

### validate() pattern

`Entity`, `AggregateRoot`, `ValueObject`, `Command`, and `Query` all declare `protected abstract validate(): void`. Each concrete subclass must implement it and call `this.validate()` explicitly at the end of its own constructor, after all parameter properties are assigned.

The error type differs by layer:

- **`Entity` / `AggregateRoot` / `ValueObject`** — throw a `DomainError` subclass for any invariant violation.
- **`Command` / `Query`** — throw `ValidationErrors` (application layer) for invalid input.

```typescript
// Domain layer — throws DomainError subclass
class Money extends ValueObject {
  constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {
    super();
    this.validate(); // called after properties are assigned
  }
  protected validate(): void {
    if (this.amount < 0) {
      throw new InvalidAmountError(this.amount);
    }
  }
}

// Application layer — throws ValidationErrors
class OpenAccountCommand extends Command {
  constructor(
    public readonly accountId: string,
    public readonly email: string
  ) {
    super();
    this.validate();
  }
  protected validate(): void {
    const errors: ValidationErrorDetail[] = [];
    if (!this.accountId) errors.push({ code: 'accountId', message: 'accountId is required' });
    if (!this.email) errors.push({ code: 'email', message: 'email is required' });
    if (errors.length) {
      throw new ValidationErrors(errors);
    }
  }
}
```

### Typical composition

```typescript
const repository = new DomainEventPublishingRepository(new BankAccountRepositoryImpl(), publisher);

const bus = new CommandBusBuilder()
  .register(OpenAccountCommand, new OpenAccountHandler(repository))
  .withTransaction(unitOfWork)
  .build();
```

Handler pattern: load aggregate → call behavior method → `save(updated)`. Event publishing is handled transparently by `DomainEventPublishingRepository` — handlers have no knowledge of the event bus.

Reference example: `docs/examples/bank-account/` — complete BankAccount example (domain, application, infrastructure, tests).

### Module / import conventions

- Source uses ESM (`"type": "module"`), `NodeNext` module resolution
- All internal imports use `.js` extensions (even for `.ts` source files)
- Path alias `@src` maps to `src/` in tests (via `moduleNameMapper` in `jest.config.ts` and `tsconfig.test.json`); use `@src` for barrel imports and `@src/domain/...` etc. for sub-module imports
- Tests live in `tests/` mirroring `src/` structure; transpiled by `@swc/jest` (no tsc during test runs)
- `tsconfig.build.json` emits to `dist/`; `tsconfig.test.json` is used by the type-check step for test files
