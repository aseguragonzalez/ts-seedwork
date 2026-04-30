# Contributing to @aseguragonzalez/ts-seedwork

Thanks for your interest in contributing. This guide covers everything you need to get started, from setting up your environment to submitting a pull request.

## Table of contents

- [Prerequisites](#prerequisites)
- [Development environment](#development-environment)
- [Command reference](#command-reference)
- [Architecture and design principles](#architecture-and-design-principles)
- [Code conventions](#code-conventions)
- [Testing](#testing)
- [Pull request process](#pull-request-process)
- [Commit style](#commit-style)
- [Reporting issues](#reporting-issues)
- [Code of conduct](#code-of-conduct)

---

## Prerequisites

- Node.js 22+
- npm
- Docker (optional, for devcontainer)

---

## Development environment

### Option 1 — Local

```bash
git clone https://github.com/aseguragonzalez/ts-seedwork.git
cd ts-seedwork
npm ci          # installs deps and sets up git pre-commit hooks via husky
```

### Option 2 — Devcontainer (VS Code / Cursor)

Open the repository in VS Code and choose **Reopen in Container** when prompted. The container starts, `npm ci` runs automatically, and husky installs the pre-commit hooks. Use npm scripts inside the integrated terminal — no host setup needed.

---

## Command reference

| Task              | Command                                                                               |
| ----------------- | ------------------------------------------------------------------------------------- |
| Install deps      | `npm ci`                                                                              |
| Full quality gate | `npm run lint && npm run format:check && npm run type:check && npm run test:coverage` |
| Lint              | `npm run lint`                                                                        |
| Format check      | `npm run format:check`                                                                |
| Format write      | `npm run format`                                                                      |
| Type check        | `npm run type:check`                                                                  |
| Tests             | `npm test`                                                                            |
| Tests (coverage)  | `npm run test:coverage`                                                               |
| Tests (watch)     | `npm run test:watch`                                                                  |
| Single test file  | `npx jest tests/path/to/file.spec.ts`                                                 |
| Build             | `npm run build`                                                                       |
| Clean dist        | `npm run clean`                                                                       |

Run the full quality gate before submitting a pull request.

---

## Architecture and design principles

This library is organised in three layers. Contributions must respect the dependency rule: inner layers never depend on outer ones.

### `src/domain/`

Pure domain building blocks with zero external dependencies. All classes and interfaces here must be free of infrastructure, framework, or I/O concerns.

- `Entity` / `AggregateRoot` — base classes. `AggregateRoot` accumulates domain events and returns a new instance on every state change — **never mutate `this`**.
- `ValueObject` — structural equality. All properties must be `readonly`.
- `Repository<ID, T>` / `UnitOfWork` — interfaces only; no implementations in this layer.
- `DomainError` — abstract base for domain failures.

### `src/application/`

CQRS contracts (interfaces only). No implementations, no infrastructure imports.

- `Command` / `CommandBus` / `CommandHandler`
- `Query` / `QueryBus` / `QueryHandler`
- `Result` / `Maybe` — value types for command and query outcomes
- `DomainEventPublisher` (outbound port) / `DomainEventHandler` (inbound port)

### `src/infrastructure/`

Concrete bus implementations and decorators. May import from domain and application; must not leak into those layers.

- `RegistryCommandBus` / `RegistryQueryBus` — registry-based routing
- `TransactionalCommandBus` — wraps any `CommandBus` with a `UnitOfWork`
- `ValidationCommandBus` / `ValidationQueryBus` — call `validate()` before dispatch
- `DomainEventPublishingRepository` — publishes domain events after `save`
- `CommandBusBuilder` / `QueryBusBuilder` — fluent builders; declaration order = stack order (first = outermost)

### Key design rules

- **CQS is non-negotiable.** Commands return nothing; queries return data. Do not blend reads and writes.
- **Aggregate behavior methods return a new instance.** Pass the new event to the constructor: `new MyAggregate(id, newState, [...this.getDomainEvents(), event])`.
- **Event publishing is transparent.** Handlers have no knowledge of the event bus — `DomainEventPublishingRepository` handles it.
- **`getDomainEvents()` is a pure read with no side effects.** It returns a copy; calling it twice returns the same events.
- **No in-place mutation of aggregates.** Not even for convenience.

---

## Code conventions

### Module and import style

- Source uses ESM (`"type": "module"`), `NodeNext` module resolution.
- All internal imports use `.js` extensions (even for `.ts` source files): `import { Foo } from './foo.js'`.
- The path alias `@seedwork` maps to `src/index.ts` in tests via `moduleNameMapper`.

### Naming

- Events: past tense, noun phrase — `AccountOpened`, `MoneyDeposited`.
- Handlers: `<UseCase>Handler` — `OpenAccountHandler`.
- Commands / queries: imperative or interrogative noun phrase — `OpenAccountCommand`, `GetBalanceQuery`.
- Domain errors: descriptive, end with `Error` — `InsufficientFundsError`.

### Do / don't

| Do                                                        | Don't                                              |
| --------------------------------------------------------- | -------------------------------------------------- |
| Return a new aggregate instance from behavior methods     | Mutate aggregate state in place                    |
| Keep domain and application layers free of infrastructure | Import a framework or DB driver from `src/domain/` |
| Use `Result.fail()` for expected domain failures          | Throw `DomainError` inside a handler               |
| Define one command and one handler per use case           | Put multiple use cases in one handler              |
| Keep event payloads serializable (primitives only)        | Store domain objects in event payloads             |

---

## Testing

- Tests live in `tests/` mirroring the `src/` structure.
- Use the [bank account fixture](tests/fixtures/bank-account/) as a reference for new examples — it exercises all building blocks end to end.
- Transpiled by `@swc/jest` (no `tsc` during test runs).
- Run a single file: `npx jest tests/domain/aggregate-root.spec.ts`
- Run the full suite: `npm test`

When adding a new component, add a test file at the matching path. When fixing a bug, add a regression test that fails before the fix and passes after.

---

## Pull request process

1. Fork the repository and create a branch from `main`.
2. Make your changes, keeping commits focused and atomic.
3. Run the full quality gate and ensure all checks pass.
4. Open a pull request against `main`. Set the **PR title** in Conventional Commits format — the CI validates it automatically (see [PR title and commit style](#pr-title-and-commit-style)).
5. A review from [@aseguragonzalez](https://github.com/aseguragonzalez) is required before merging.

Pull requests that change the public API should include an update to [docs/component-reference.md](docs/component-reference.md).

---

## PR title and commit style

This repository uses **squash merge** — the PR title becomes the single commit that lands on `main`. Semantic-release reads it to determine the version bump, so it must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(optional scope): <short description>
```

Valid types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`, `ci`.

The CI validates the PR title format automatically. Commits inside the PR are free-form — following the same convention is good practice (Husky enforces it locally) but they do not affect versioning.

### API surface changes

The CI compares the compiled `.d.ts` files of the PR against `main`. If the public API changed, the PR title type must reflect the severity:

| Change                                           | Required type                        |
| ------------------------------------------------ | ------------------------------------ |
| New export, added optional property or parameter | `feat:`                              |
| Removed export, changed or removed signature     | `feat!:` or `BREAKING CHANGE` footer |

Examples:

```
feat(domain): add AggregateRoot.clearDomainEvents helper
fix(infrastructure): rollback transaction on ValidationErrors
feat!: remove ApplicationService base class
```

---

## Testing with a pre-release

If your changes need to be validated in a consuming project before merging, you can publish a pre-release directly from your branch:

1. In GitHub → **Actions** → **Pre-release** → **Run workflow**
2. Select your branch from the branch dropdown
3. Enter `pr-{your-pr-number}` as the identifier (e.g. `pr-42`) — this convention enables automatic cleanup when the PR closes
4. Wait for the workflow to complete — the **Job Summary** shows the exact install commands

Install the pre-release in another project:

```bash
# by tag — always points to the latest publish from this PR
npm install @aseguragonzalez/ts-seedwork@pr-42

# by exact version — shown in the Job Summary
npm install @aseguragonzalez/ts-seedwork@0.0.0-pr-42.7
```

The dist-tag is removed automatically when the PR is closed or merged.

---

## Reporting issues

- **Bugs** — use the [bug report template](https://github.com/aseguragonzalez/ts-seedwork/issues/new?template=bug_report.yml).
- **Feature requests** — use the [feature request template](https://github.com/aseguragonzalez/ts-seedwork/issues/new?template=feature_request.yml).
- **Questions** — use [GitHub Discussions](https://github.com/aseguragonzalez/ts-seedwork/discussions).
- **Security vulnerabilities** — see [SECURITY.md](SECURITY.md). Do not open a public issue.

---

## Code of conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating you agree to uphold it. Instances of unacceptable behavior may be reported to [a.segura.gonzalez@gmail.com](mailto:a.segura.gonzalez@gmail.com).
