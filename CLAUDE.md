# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow

Every change goes through three stages — never skip straight to code:

1. **Analyze and open the issue(s).** Understand the request, confirm the understanding
   with the requester, then open (or confirm) a GitHub issue with clear, testable
   acceptance criteria. A request that bundles unrelated concerns splits into more than
   one issue — one per independently shippable concern — rather than one issue standing in
   for all of them. No PR without at least one linked issue (`Closes #N` or `Relates to
#N` — see `.claude/skills/gh-workflow/SKILL.md`).
2. **Plan before implementing.** Re-read the issue and draft an implementation plan that
   separates **code**, **tests**, and **documentation** as independent tracks built
   against the same agreed contracts (interfaces/type signatures decided up front), so the
   tracks don't conflict with each other. A large or naturally incremental issue may be
   delivered through more than one PR; decide this up front rather than mid-implementation.
3. **Implement in parallel.** Execute the plan using parallel agents for code, tests, and
   documentation (see `.claude/agents/`) against the contracts fixed in step 2. Subagents
   don't share context with the main conversation or each other — include the fixed
   contract explicitly in every agent's prompt, don't assume they can infer it from one
   another's work.

Additional rules that apply throughout:

- All documentation and GitHub artifacts — issues, PRs, commit messages, code comments —
  are written in English, regardless of the language used in conversation, and are
  **direct and concise**: state the what/why/how, never the conversation or reasoning
  process that led to it. No narrative, no TL;DR filler.
- While analyzing any request, check whether nearby code could be improved. If so, do not
  bundle the improvement into the current change — open a separate issue for it (see the
  `boy-scout` skill).
- For bug reports, analyze the problem and propose a solution before opening an issue for
  it (see the `bug-triage` skill).
- PR review comments (yours or a bot reviewer's) are answered in English, as a reply in
  the same review-comment thread — never a new top-level PR comment.
- See `.claude/skills/gh-workflow/SKILL.md` for label taxonomy, identity, reviewer, and
  issue/PR mechanics.

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

### Commit and PR conventions

The type **must match the layer actually changed**, not just be "valid" Conventional
Commits — a mismatch either ships a spurious release or silently swallows one that should
have shipped:

- `fix:` / `feat:` / `feat!:` — only when `src/` behavior changed (see the version-bump
  and API-surface tables above).
- `docs:` — changes limited to `docs/`, `README.md`, or `CLAUDE.md`.
- `ci:` — `.github/workflows/` or other pipeline-only changes.
- `chore:` / `build:` — tooling, `package.json` build config, `.claude/` scaffolding,
  dependency bumps with no behavior change.
- `refactor:` — no behavior or public-API change; must never trigger a release.
- `test:` — test-only changes.

See `.claude/skills/gh-workflow/SKILL.md` for the full commit-type-to-release-impact
table (including the `.releaserc.json` `fix(deps)`/`fix(deps-dev)` non-releasing rules),
label taxonomy, identity split, reviewer rules, and PR release-readiness checks.

### Pre-release workflow

To publish a testable build from a PR branch: GitHub Actions → **Pre-release** → Run workflow → select branch → enter `pr-{number}` as identifier. Pre-release versions are kept permanently on the registry.

## Dependency security exceptions

This repo has three mechanisms for consciously accepting a dependency-security tradeoff it can't fix immediately — `package.json` `overrides`, `.github/dependabot.yml` `ignore` rules, and the `audit-ci.jsonc` `allowlist` — each watched by its own weekly staleness-check workflow. Before adding an override, an ignore rule, or an allowlist entry (or silencing an `npm audit` failure some other way), read `.github/SECURITY_EXCEPTIONS.md` for which mechanism fits and what to verify before removing one.

## Architecture

This is a DDD seedwork library (`@aseguragonzalez/ts-seedwork`) published to npm. It provides base classes and interfaces for building domain-driven TypeScript applications using CQRS.

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
    if (!this.accountId) {
      errors.push({ code: 'accountId', message: 'accountId is required' });
    }
    if (!this.email) {
      errors.push({ code: 'email', message: 'email is required' });
    }
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

## Claude Code agents and skills for this repo

Agents under `.claude/agents/` implement the parallel code/test/docs tracks from
"Workflow" above, plus two cross-cutting agents:

- **`ts-implementer`** — the `src/` track, against a fixed contract.
- **`ts-test-writer`** — the `tests/` track, against the same contract.
- **`docs-aligner`** — the `docs/` track, against the same contract.
- **`boy-scout`** — finds and either executes or files refactoring opportunities.
- **`bug-analyst`** — investigates a reported defect and proposes a fix before any issue
  is opened.

Skills under `.claude/skills/`:

- **`gh-workflow`** — the full issue-first workflow: identity, label taxonomy, reviewer,
  commit-type table, and PR release-readiness checks.
- **`boy-scout`** — when/how to apply the boy-scout rule (execute inline vs. separate
  issue).
- **`bug-triage`** — the analyze → confirm → issue flow for bug reports.

`.claude/settings.json` (committed, shared across contributors) holds a conservative,
mostly-read-only permissions allowlist for these workflows: `npm ci`/`npm run
lint|format:check|type:check|test*|build|clean`, `git status/diff/log/show/branch`, and
read-only `gh`. It deliberately excludes `git commit`/`push` and `gh issue`/`pr create`,
which always prompt. Personal or exploratory permissions belong in each contributor's own
`.claude/settings.local.json` instead.
