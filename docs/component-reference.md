# Component Reference

All components are exported from the package root (`@aseguragonzalez/seedwork`).

---

## Domain layer

### `Entity<ID>`

- **Role:** Base class for DDD entities. Identity over attributes — two entities are equal when they share the same `id`, regardless of other properties.
- **Usage:** Extend with your entity class. The `id` property is `public readonly`. Pass the id to `super(id)`. Throws if `id` is falsy.
- **Key methods:** `equals(other: Entity<ID>): boolean` — delegates to `id.equals(otherId)` when `id` has an `equals` method (e.g. a `ValueObject` ID), falls back to `===` otherwise.

```typescript
class Transaction extends Entity<TransactionId> {
  constructor(
    id: TransactionId,
    public readonly amount: Money
  ) {
    super(id);
  }
}
```

---

### `AggregateRoot<ID>`

- **Role:** Root of an aggregate. Single entry point for state changes. Records domain events without side effects.
- **Usage:** Extend with your aggregate class. Pass the `id` (and optionally an initial `events` array for reconstitution) to `super`. Behavior methods return a **new instance** — never mutate `this`. Call `getDomainEvents()` in the handler to retrieve accumulated events before saving.
- **Key methods:**
  - `getDomainEvents(): ReadonlyArray<TypedDomainEvent<Record<string, unknown>>>` — pure read; returns a copy of the current event list. Calling it twice returns the same events. Has no side effects.

```typescript
class BankAccount extends AggregateRoot<BankAccountId> {
  private constructor(
    id: BankAccountId,
    public readonly balance: Money,
    events: ReadonlyArray<DomainEvent> = []
  ) {
    super(id, events);
  }

  static open(id: BankAccountId, balance: Money): BankAccount {
    const event = AccountOpened.create(id.value, balance);
    return new BankAccount(id, balance, [event]);
  }

  deposit(amount: Money): BankAccount {
    const event = MoneyDeposited.create(this.id.value, amount);
    return new BankAccount(this.id, this.balance.add(amount), [...this.getDomainEvents(), event]);
  }
}
```

The handler pattern after this design:

```typescript
const account = await repository.findById(id);
const updated = account.deposit(amount); // returns new instance with accumulated event
await repository.save(updated); // DomainEventPublishingRepository publishes events
```

**Important — `reconstitute` pattern:** When loading an aggregate from persistence, always reconstitute it without domain events (events have already been published). Define a `static reconstitute(...)` factory that passes an empty events list. The repository's `save` implementation should store the reconstituted form. This ensures each command execution starts with a clean event slate and `getDomainEvents()` only returns events raised during the current operation.

```typescript
static reconstitute(id: BankAccountId, owner: string, balance: Money): BankAccount {
  return new BankAccount(id, owner, balance); // no events — already published
}
```

---

### `ValueObject`

- **Role:** Immutable object defined entirely by its attributes. Two value objects are equal when all their properties are equal.
- **Usage:** Extend and keep all properties `readonly`. Call `super()` from your constructor. Validate in the constructor and throw a domain-specific error on invalid state.
- **Supported property types in `equals`:** primitives (`===`), nested `ValueObject` (recursive), `Date` (by timestamp), arrays of the previous types.
- **Key methods:** `equals(other: ValueObject): boolean`, `toString(): string` (auto-generated from property names and values).

```typescript
class Money extends ValueObject {
  constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {
    super();
    if (amount < 0) throw new InvalidAmountError();
  }
}
```

---

### `DomainEvent` / `TypedDomainEvent` / `BaseDomainEvent`

- **`DomainEvent`** — base interface: `{ readonly id: string; readonly occurredAt: Date }`. Used as the base constraint for event handlers.
- **`TypedDomainEvent<TPayload>`** — extends `DomainEvent` adding `readonly payload: TPayload`. Used by concrete handlers for compile-time typed access to event data.
- **`BaseDomainEvent<TPayload>`** — abstract class implementing `TypedDomainEvent<TPayload>`. Constructor: `(payload: TPayload, id?: string, occurredAt?: Date)` — `id` defaults to `crypto.randomUUID()`, `occurredAt` defaults to `new Date()`.
- **Usage:** Extend `BaseDomainEvent<TPayload>` per event type with a typed payload alias. Use a `private constructor` and a `static create(...)` factory. Name events in past tense. Keep payload serializable (primitives only).

```typescript
type MoneyDepositedPayload = { accountId: string; amount: number; currency: string };

class MoneyDeposited extends BaseDomainEvent<MoneyDepositedPayload> {
  static create(accountId: string, amount: Money): MoneyDeposited {
    return new MoneyDeposited({ accountId, amount: amount.amount, currency: amount.currency });
  }
  private constructor(payload: MoneyDepositedPayload) {
    super(payload);
  }
}
```

---

### `Repository<ID, T>`

- **Role:** Collection-like port for an aggregate. Defined in the domain layer; implemented in infrastructure.
- **Methods:** `findById(id: ID): Promise<T | null>`, `save(entity: T): Promise<void>`, `deleteById(id: ID): Promise<void>`.
- **Usage:** Define a typed sub-interface per aggregate in the domain layer. Implement in infrastructure.

```typescript
// domain/bank-account.repository.ts
export interface BankAccountRepository extends Repository<BankAccountId, BankAccount> {}
```

---

### `UnitOfWork`

- **Role:** Transaction boundary port. Defined in domain; implemented in infrastructure.
- **Methods:** `createSession(): Promise<void>`, `commit(): Promise<void>`, `rollback(): Promise<void>`.
- **Usage:** Implement for your persistence mechanism (DB transaction, etc.). Used by `TransactionalCommandBus`.

---

### `DomainError`

- **Role:** Abstract base class for domain failures. Extends `Error`. `abstract` — must be subclassed; instantiating it directly is not possible.
- **Constructor:** `(message: string, code: string)` — `this.name` is set automatically to the subclass name via `this.constructor.name`.
- **Usage:** Define one named subclass per domain failure. The class name carries the ubiquitous language (`InsufficientFundsError`); `code` carries the external contract identifier for API mapping.

```typescript
class InsufficientFundsError extends DomainError {
  constructor() {
    super('Insufficient funds', 'INSUFFICIENT_FUNDS');
  }
}
```

---

### `Logger`

- **Role:** Cross-cutting logging port.
- **Methods:** `debug`, `info`, `warn`, `error`, `fatal`. Each takes `(message: string, ...extras)`.
- **Usage:** Inject into handlers or infrastructure implementations; implement with your logging library.

---

## Application layer

### `Result` / `ResultError`

- **`Result`** — value class returned by `CommandBus.dispatch()`. Encapsulates success or expected failure.
- **`ResultError`** — shape of each failure entry: `{ code: string; description: string }`.
- **Factories:** `Result.ok()` for success; `Result.fail(errors)` for expected domain failures.
- **Guards:** `.isOk()` returns `true` on success; `.isFail()` returns `true` on failure. `.errors` holds the failure list (empty array on success).
- **Convention:** use `Result` for expected domain failures at the application boundary. Infrastructure failures (timeouts, connection drops) should still propagate as exceptions.

```typescript
const result = await bus.dispatch(command);
if (result.isFail()) {
  return res.status(422).json({ errors: result.errors });
}
res.status(204).send();
```

---

### `Command` / `CommandBus` / `CommandHandler`

- **`Command`** — marker interface; implemented by command DTOs. Requires `validate(): void` — the compiler enforces the method; calling it is opt-in via `ValidationCommandBus`.
- **`CommandHandler<TCommand>`** — `execute(command: TCommand): Promise<void>`.
- **`CommandBus`** — `dispatch(command: Command): Promise<Result>`. The entry point for write operations.
- **Usage:** One command class and one handler per write use case. Commands carry intent and primitives — no domain objects at the port boundary when avoidable.

---

### `Maybe<T>`

- **Role:** Single immutable class that models presence (`Maybe.just(value)`) or absence (`Maybe.nothing()`). Lives in `queries.ts` — it is the return type of the query bus.
- **Guards:** `isJust()` narrows the type to `Maybe<T> & { readonly value: T }` via a type predicate, giving direct access to `.value` without `undefined`. `isNothing()` returns `boolean`.
- **Accessor:** `.value` is `T | undefined` — access it safely inside an `isJust()` block.
- **Convention:** use `Maybe.nothing()` for absence and for authorization failures (never reveal whether a resource exists to an unauthorized caller).

```typescript
const result = await queryBus.ask<BalanceData>(new GetBalanceQuery(id));
if (result.isNothing()) return res.status(404).send();
return res.json(result.value);
```

---

### `Query` / `QueryBus` / `QueryHandler`

- **`Query`** — interface for query DTOs. Requires `validate(): void` — implement with a no-op body when no validation is needed. The compiler enforces the method exists; calling it is the developer's responsibility (opt-in via `ValidationQueryBus`).
- **`QueryHandler<TQuery, T>`** — `execute(query: TQuery): Promise<Maybe<T>>`.
- **`QueryBus`** — `ask<T>(query: Query): Promise<Maybe<T>>`. Entry point for reads.
- **Usage:** One query class and one handler per read use case. Handlers return plain projection types — never domain entities.

---

### `DomainEventPublisher`

- **Role:** Outbound port for publishing domain events. Defined in the application layer; implemented in infrastructure.
- **Method:** `publish(events: ReadonlyArray<DomainEvent>): Promise<void>`.
- **Usage:** Do **not** inject this into command handlers — event publishing should be transparent via `DomainEventPublishingRepository`. Inject it into infrastructure components (e.g. the repository decorator or a message broker adapter).

---

### `DomainEventHandler<TEvent>`

- **Role:** Inbound port for reacting to domain events. Implemented in the application layer.
- **Method:** `handle(event: TEvent): Promise<void>`.
- **Usage:** One handler class per event type. Wiring (routing event names to handlers) is the responsibility of the consuming project's composition root — it is not prescribed by this package.

---

## Infrastructure layer

### `RegistryCommandBus`

- **Role:** `CommandBus` implementation. Routes commands to handlers via an in-process registry keyed by command constructor.
- **Usage:** `register(CommandClass, handler)` to wire handlers; `dispatch(command)` to execute.

---

### `RegistryQueryBus`

- **Role:** `QueryBus` implementation. Same registry pattern for queries.
- **Usage:** `register(QueryClass, handler)`; `ask(query)`.

---

### `ValidationQueryBus`

- **Role:** `QueryBus` decorator. Calls `query.validate()` before delegating.
- **Usage:** Opt-in. Wrap the inner query bus when query DTOs carry a `validate()` method. `ValidationErrors` propagates as an exception — it is not caught.

```typescript
const queryBus = new ValidationQueryBus(new RegistryQueryBus());
```

---

### `TransactionalCommandBus`

- **Role:** `CommandBus` decorator. Wraps every dispatch in a `UnitOfWork` transaction: `createSession → dispatch → commit` on success, `rollback + rethrow` on exception.
- **Usage:** Pass any `CommandBus` and a `UnitOfWork` implementation. Typically placed inside `ValidationCommandBus` so validation errors do not open a transaction — use `CommandBusBuilder` to wire the stack in the right order.

---

### `DomainEventPublishingRepository<ID, T>`

- **Role:** `Repository` decorator that publishes domain events after every `save`. Keeps use-case handlers free of event-publishing logic.
- **Usage:** Wrap any `Repository` implementation with a `DomainEventPublisher`. The decorator calls `publisher.publish(entity.getDomainEvents())` after the inner `save` completes. `delete` and `getById` delegate without side effects — if deletion has domain significance, model it as an aggregate operation and call `save` before (or instead of) `delete`.

```typescript
const publisher: DomainEventPublisher = new MyMessageBrokerPublisher();
const repository = new DomainEventPublishingRepository(new BankAccountRepositoryImpl(), publisher);

// Handler stays clean — no event publishing, no knowledge of the bus:
class DepositMoneyHandler implements CommandHandler<DepositMoneyCommand> {
  constructor(private readonly repository: BankAccountRepository) {}

  async execute(command: DepositMoneyCommand): Promise<void> {
    const account = await this.repository.findById(new BankAccountId(command.accountId));
    const updated = account.deposit(new Money(command.amount, command.currency));
    await this.repository.save(updated); // decorator publishes events transparently
  }
}
```

**Note:** The inner repository's `save` should persist the aggregate in its reconstituted form (no domain events). See the `reconstitute` pattern in the `AggregateRoot` section.

---

### `CommandBusBuilder`

- **Role:** Fluent builder for assembling a `CommandBus` stack.
- **Methods:**
  - `.register(CommandClass, handler)` — wire a handler for a command type. Calling it multiple times with the same class overwrites the previous handler.
  - `.withValidation()` — add `ValidationCommandBus`.
  - `.withTransaction(unitOfWork)` — add `TransactionalCommandBus`. Calling it multiple times nests multiple transaction layers.
  - `.use(factory)` — add any custom `CommandBus` middleware.
  - `.build()` — return the assembled `CommandBus`.
- **Composition order:** declaration order determines the stack — the first declared step is outermost. To get `Validation → Transaction → Registry`, call `.withValidation()` before `.withTransaction()`.

```typescript
const bus = new CommandBusBuilder()
  .register(OpenAccountCommand, new OpenAccountHandler(repo))
  .register(DepositMoneyCommand, new DepositMoneyHandler(repo))
  .withValidation() // outermost — validates before opening the transaction
  .withTransaction(unitOfWork)
  .build();
```

With this stack, each dispatch:

1. Validates the command (`withValidation`) — throws `ValidationErrors` before a transaction is opened
2. Opens a transaction (`withTransaction`) — commits on success, rolls back and rethrows on unexpected exception
3. Executes the handler (`registry`) — `DomainError` maps to `Result.fail`; other exceptions propagate
