# Coding Standards — ts-seedwork

## TypeScript Baseline

- `strict: true` enabled — no implicit `any`, no loose nulls
- `readonly` on all properties; prefer `Readonly<T>` for object shapes
- `abstract class` for base types (`BaseDomainEvent`, `BaseIntegrationEvent`, etc.)
- No `class` with public mutable state
- Async/await throughout; no raw Promise chains
- Barrel exports via `index.ts` per layer

## Do / Don't Overview

| Concern | Do | Don't |
|---|---|---|
| Domain errors | Throw `DomainError` subclasses | Throw `Error` directly |
| Validation | `validate()` in `Command`/`Query`; `ValidationCommandBus` | Validate in handler |
| Bus stack | `Validation → Transactional → DomainEventCoordinator → Registry` | Skip layers |
| Domain events | Pass events array to `AggregateRoot` constructor; `DomainEventPublishingRepository` publishes via `DomainEventBusPublisher` | Call handlers directly |
| Integration events | Publish from `DomainEventHandler` via `IntegrationEventPublisher` | Publish from aggregate |
| Tasks | Schedule from `DomainEventHandler` via `TaskScheduler` | Call task handlers directly |
| Repository | Inject `DomainEventPublishingRepository` decorator | Publish events in use case |
| Queries | Return `Maybe<T>` | Return `null` / `undefined` |

---

## Domain Layer

### Entity

- Extend `Entity`; identity is typically a `ValueObject` subclass
- Override `equals()` by identity only
- No setters; mutate state only through domain methods

```typescript
class Account extends Entity<AccountId> {
  private constructor(
    id: AccountId,
    private readonly email: Email,
  ) {
    super(id);
  }

  static create(id: AccountId, email: Email): Account {
    return new Account(id, email);
  }
}
```

### Value Object

- Extend `ValueObject`; all fields `readonly`
- Structural equality is automatic — `ValueObject.equals()` compares all own properties recursively; no override needed
- Throw a `DomainError` subclass in constructor for invalid state

```typescript
class Email extends ValueObject {
  readonly value: string;

  constructor(value: string) {
    super();
    if (!value.includes('@')) throw new InvalidEmailException(value);
    this.value = value;
  }
}
```

### Aggregate Root

- Extend `AggregateRoot`; pass domain events to the constructor — the base class stores them for `getDomainEvents()`
- Behaviour methods return a new instance carrying the accumulated events (immutable pattern)
- One aggregate per transaction boundary

```typescript
class BankAccount extends AggregateRoot<BankAccountId> {
  private constructor(
    id: BankAccountId,
    private readonly owner: string,
    private readonly balance: Money,
    events: ReadonlyArray<TypedDomainEvent<Record<string, unknown>>> = [],
  ) {
    super(id, events);
  }

  static open(id: BankAccountId, owner: string, initialBalance: Money): BankAccount {
    const event = AccountOpened.create(id.value, owner, initialBalance);
    return new BankAccount(id, owner, initialBalance, [event]);
  }

  deposit(amount: Money): BankAccount {
    const event = MoneyDeposited.create(this.id.value, amount);
    return new BankAccount(this.id, this.owner, this.balance.add(amount), [
      ...this.getDomainEvents(),
      event,
    ]);
  }
}
```

### Domain Events

- Extend `BaseDomainEvent<TPayload>`; payload fields are primitives only (no VOs, no entities)
- Pass `aggregateId` as the first constructor argument — identifies the emitting aggregate
- `type` and `version` belong on `IntegrationEvent`, not `DomainEvent`
- Named in past tense: `AccountOpened`, `OrderShipped`

```typescript
type AccountOpenedPayload = {
  accountId: string;
  owner: string;
  amount: number;
  currency: string;
};

class AccountOpened extends BaseDomainEvent<AccountOpenedPayload> {
  static create(accountId: string, owner: string, initialBalance: Money): AccountOpened {
    return new AccountOpened(
      accountId,  // aggregateId — first arg, required on every domain event
      { accountId, owner, amount: initialBalance.amount, currency: initialBalance.currency },
    );
  }

  private constructor(aggregateId: string, payload: AccountOpenedPayload) {
    super(aggregateId, payload);
  }
}
```

### Repository Interface

- Declared in Domain layer; no infrastructure imports
- Extend `Repository<TId, TAggregate>`; methods are identity-based only (`findById`, `save`, `deleteById`)
- Never add query methods (`findByEmail`, `findByStatus`) — define a read repository in the application layer

```typescript
interface AccountRepository extends Repository<AccountId, Account> {}
```

### Domain Errors

- One file per error; extend `DomainError`
- Name describes the violated invariant, not the HTTP status

```typescript
class AccountAlreadyExistsException extends DomainError {
  constructor(email: string) {
    super(`Account with email ${email} already exists`);
  }
}
```

---

## Application Layer

### Command / Query

- `Command` and `Query` are interfaces; concrete subclasses implement `validate(): void`
- Throw `ValidationErrors` inside `validate()`
- `ValidationCommandBus` / `ValidationQueryBus` call `validate()` before dispatching

```typescript
class OpenAccountCommand implements Command {
  constructor(
    readonly accountId: string,
    readonly email: string,
  ) {}

  validate(): void {
    const errors: ValidationErrorDetail[] = [];
    if (!this.accountId) errors.push({ code: 'accountId', message: 'accountId is required' });
    if (!this.email) errors.push({ code: 'email', message: 'email is required' });
    if (errors.length) throw new ValidationErrors(errors);
  }
}
```

### CommandHandler / QueryHandler

- Implement `CommandHandler<TCommand>` or `QueryHandler<TQuery, TResult>`
- Entry point method is `handle()` (not `execute()`)
- `handle()` returns `Promise<void>` — the bus wraps the outcome in `Result`
- One handler per command/query; no business logic outside the handler

```typescript
class OpenAccountCommandHandler implements CommandHandler<OpenAccountCommand> {
  constructor(private readonly accounts: AccountRepository) {}

  async handle(command: OpenAccountCommand): Promise<void> {
    const account = BankAccount.open(
      new BankAccountId(command.accountId),
      command.owner,
      new Money(command.amount, command.currency),
    );
    await this.accounts.save(account);
  }
}
```

### Execution context — correlationId propagation

`correlationId` is a cross-cutting tracing concern set at the entry point and read by any component that needs it — without threading it through function signatures. The `Command` does **not** carry `correlationId`.

```typescript
// shared module, e.g. context.ts
import { AsyncLocalStorage } from 'node:async_hooks';

export const correlationStore = new AsyncLocalStorage<string>();

// Entry point (API controller, subscriber)
const correlationId = req.headers['x-correlation-id'] ?? randomUUID();
correlationStore.run(correlationId, () => next());
```

`AsyncLocalStorage` propagates the value automatically through all async calls within the same execution context.

---

### Integration Events

Application layer contracts — no infrastructure imports.

- `BaseIntegrationEvent` carries `type`, `version`, `aggregateId`, `payload`, `correlationId` (required), `causationId?`, `metadata?`
- Declare `static readonly TYPE` and `static readonly VERSION` on every concrete subclass
- Use a static factory method `create(event)` to construct from a domain event
- Publish from a `DomainEventHandler`, never from the aggregate or the use-case handler
- `IntegrationEventPublisher.publish()` takes `ReadonlyArray<IntegrationEvent>`

```typescript
type AccountOpenedPayload = {
  accountId: string;
  owner: string;
  amount: number;
  currency: string;
};

class AccountOpenedIntegrationEvent extends BaseIntegrationEvent {
  static readonly TYPE = 'banking.bank_account.account_opened';
  static readonly VERSION = '1.0';

  static create(event: AccountOpened): AccountOpenedIntegrationEvent {
    return new AccountOpenedIntegrationEvent(
      event.aggregateId,
      {
        accountId: event.payload.accountId,
        owner: event.payload.owner,
        amount: event.payload.amount,
        currency: event.payload.currency,
      },
      correlationStore.getStore() ?? randomUUID(),  // from execution context
      event.id,                                      // causationId
    );
  }

  private constructor(
    aggregateId: string,
    payload: AccountOpenedPayload,
    correlationId: string,
    causationId?: string,
  ) {
    super(
      AccountOpenedIntegrationEvent.TYPE,
      AccountOpenedIntegrationEvent.VERSION,
      aggregateId,
      payload,
      correlationId,
      causationId,
    );
  }
}

class AccountOpenedDomainEventHandler implements DomainEventHandler<AccountOpened> {
  constructor(private readonly publisher: IntegrationEventPublisher) {}

  async handle(event: AccountOpened): Promise<void> {
    await this.publisher.publish([AccountOpenedIntegrationEvent.create(event)]);
  }
}
```

**Key rules:**
- `correlationId` comes from the execution context (`AsyncLocalStorage`) — set at the entry point
- `causationId` is the domain event `id` — records what directly triggered this integration event
- `publish()` takes an array — pass `[event]` even for a single event
- `IntegrationEventPublisher` is a port; wired to `OutboxIntegrationEventPublisher` in infrastructure

### Background Tasks

Application layer contracts — no infrastructure imports.

- `BaseBackgroundTask` provides the constructor; subclasses declare `static readonly TYPE`
- `TaskHandler<T>` implements `handle(task: T): Promise<void>` — design for idempotency
- `TaskScheduler` port: `schedule(task): Promise<void>` — schedule from `DomainEventHandler`

```typescript
class SendWelcomeEmailTask extends BaseBackgroundTask {
  static readonly TYPE = 'send-welcome-email';

  static create(event: AccountOpened): SendWelcomeEmailTask {
    return new SendWelcomeEmailTask(
      { accountId: event.aggregateId },
      correlationStore.getStore() ?? randomUUID(),
      event.id,
    );
  }

  private constructor(
    payload: Record<string, unknown>,
    correlationId: string,
    causationId?: string,
  ) {
    super(SendWelcomeEmailTask.TYPE, payload, correlationId, causationId);
  }
}

class SendWelcomeEmailTaskHandler implements TaskHandler<SendWelcomeEmailTask> {
  async handle(task: SendWelcomeEmailTask): Promise<void> {
    // idempotent — safe to retry
  }
}

class AccountOpenedDomainEventHandler implements DomainEventHandler<AccountOpened> {
  constructor(
    private readonly publisher: IntegrationEventPublisher,
    private readonly scheduler: TaskScheduler,
  ) {}

  async handle(event: AccountOpened): Promise<void> {
    await this.publisher.publish([AccountOpenedIntegrationEvent.create(event)]);
    await this.scheduler.schedule(SendWelcomeEmailTask.create(event));
  }
}
```

**Key rules:**
- `TYPE` static string is the discriminator — used by the task runner to route to the handler
- Handlers must be idempotent; the outbox may deliver a task more than once
- Do not schedule tasks from use-case handlers — use domain event handlers to decouple

---

## Infrastructure Layer

### Repository Implementation

- Implement the domain interface; extend a base ORM/driver adapter
- Wrap with `DomainEventPublishingRepository` decorator — the decorator reads `aggregate.getDomainEvents()` and publishes via `DomainEventBusPublisher`
- The use-case handler is unaware of event publishing

```typescript
// wired in composition root:
const repo = new DomainEventPublishingRepository(
  new PostgresAccountRepository(db),
  domainEventBus,          // typed as DomainEventBusPublisher
);
```

### DomainEventBus Wiring

Three interfaces serve different roles:

| Interface | Used by |
|---|---|
| `DomainEventBusPublisher` | `DomainEventPublishingRepository` decorator |
| `DomainEventBusSubscriber` | Composition root — registers handlers |
| `DomainEventBus` | `CommandBusBuilder.withDomainEventCoordination()` |

`DeferredDomainEventBus` implements all three. Buffer is keyed by `event.id` — idempotent if the same aggregate is saved more than once in the same transaction.

```typescript
// composition root
const domainEventBus = new DeferredDomainEventBus();

// register handlers (DomainEventBusSubscriber)
domainEventBus.subscribe(AccountOpened, new AccountOpenedDomainEventHandler(integrationPublisher, taskScheduler));

// wrap domain repository (DomainEventBusPublisher)
const accounts = new DomainEventPublishingRepository(
  new PostgresAccountRepository(db),
  domainEventBus,
);

// dispatch() drains the buffer and calls handlers; discard() clears without processing
// both are called internally by DomainEventCoordinatorCommandBus
```

**Key methods on `DeferredDomainEventBus`:**
- `publish(events)` — buffers events keyed by `event.id` (idempotent)
- `subscribe(EventClass, handler)` — registers a handler for a specific event type
- `dispatch()` — drains the buffer and invokes matching handlers
- `discard()` — clears the buffer without invoking handlers

### CommandBus Stack

Four decorators compose the stack. Declaration order in `CommandBusBuilder` determines wrapping: **first declared = outermost** (runs first on every `dispatch` call).

Dispatch execution order:

```
Validation → Transactional → DomainEventCoordinator → Registry
```

`CommandBusBuilder` composes them — declare outermost first:

```typescript
const commandBus = new CommandBusBuilder()
  .register(OpenAccountCommand, new OpenAccountCommandHandler(accounts))
  .withValidation()                              // outermost — validates before anything runs
  .withTransaction(unitOfWork)                   // opens transaction before coordinator
  .withDomainEventCoordination(domainEventBus)   // dispatches events after handler, inside transaction
  .build();
```

**Flow per command:**
1. `ValidationCommandBus` calls `command.validate()`
2. `TransactionalCommandBus` opens a UoW transaction
3. `DomainEventCoordinatorCommandBus` calls `dispatch()` after the handler returns, `discard()` on rollback
4. `RegistryCommandBus` routes to the correct `CommandHandler.handle()`

### Outbox Implementations (Infrastructure)

- `OutboxIntegrationEventPublisher implements IntegrationEventPublisher` — persists to `IntegrationEventOutboxRecord`
- `OutboxTaskScheduler implements TaskScheduler` — persists to `TaskOutboxRecord`
- Both outboxes have independent schemas and lifecycles

### InMemory Implementations (Testing)

All InMemory types expose a spy interface for test assertions and a `reset()` method:

- `InMemoryIntegrationEventPublisher` implements `IntegrationEventPublisherSpy` — inspect via `published`
- `InMemoryTaskScheduler` implements `TaskSchedulerSpy` — inspect via `scheduled`
- `InMemoryIntegrationEventOutboxRepository` implements `IntegrationEventOutboxRepositorySpy`
- `InMemoryTaskOutboxRepository` implements `TaskOutboxRepositorySpy`
- `InMemoryRepository` — use `RepositorySpy<TId, TAggregate>` interface with `all` and `reset()`
- `DeferredDomainEventBusSpy` — extends `DeferredDomainEventBus` with `pending` getter and `reset()`

```typescript
// spy usage in tests
const publisher = new InMemoryIntegrationEventPublisher();
// ... run use case ...
expect(publisher.published).toHaveLength(1);
expect(publisher.published[0]).toBeInstanceOf(AccountOpenedIntegrationEvent);
publisher.reset();
```

`InMemoryTaskScheduler` additionally supports `register(type, handler)` and `executeScheduled()` to simulate the full outbox → task runner cycle in functional tests:

```typescript
const scheduler = new InMemoryTaskScheduler();
scheduler.register(SendWelcomeEmailTask.TYPE, new SendWelcomeEmailTaskHandler());
// ... run use case ...
await scheduler.executeScheduled();   // executes all scheduled tasks in-process
```

---

## Result

```typescript
// Command bus returns Result — inspect at the entry point
const result = await commandBus.dispatch(command);

if (result.isFailed()) {
  return errorResponse(result.errors);
}
```

`Result.ok()` — success. `Result.failed(errors)` — domain failure.

---

## Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Entity | `PascalCase` | `Account` |
| Value Object | `PascalCase` | `Email`, `AccountId` |
| Aggregate | `PascalCase` | `Order` |
| Domain Event | past tense `PascalCase` | `AccountOpened` |
| Integration Event | past tense + `IntegrationEvent` suffix | `AccountOpenedIntegrationEvent` |
| Background Task | noun + `Task` suffix | `SendWelcomeEmailTask` |
| Command | imperative + `Command` | `OpenAccountCommand` |
| Query | noun/adjective + `Query` | `FindAccountByEmailQuery` |
| Handler | noun + `Handler` | `OpenAccountCommandHandler` |
| Repository interface | noun + `Repository` | `AccountRepository` |
| Repository impl | driver + noun + `Repository` | `PostgresAccountRepository` |
| Domain error | descriptive + `Exception` (extends `DomainError`) | `AccountAlreadyExistsException` |
| File | `kebab-case.ts` | `open-account-command-handler.ts` |

---

## File / Folder Structure

```
src/
  domain/
    account/
      account.ts
      account-id.ts
      email.ts
      account-opened.ts             # DomainEvent
      account-repository.ts         # Repository interface
      account-already-exists.exception.ts
      index.ts
  application/
    open-account/
      open-account.command.ts
      open-account.handler.ts
      account-opened.domain-event-handler.ts
      account-opened.integration-event.ts
      send-welcome-email.task.ts
      send-welcome-email.task-handler.ts
      index.ts
    index.ts
  infrastructure/
    persistence/
      postgres-account.repository.ts
    outbox/
      outbox-integration-event-publisher.ts
      outbox-task-scheduler.ts
    index.ts
  index.ts
```

**Rules:**
- One concept per file; no god files
- Barrel `index.ts` at each layer boundary — never import across layers by deep path
- Infrastructure imports Application and Domain; Application imports Domain only; Domain imports nothing from this codebase
