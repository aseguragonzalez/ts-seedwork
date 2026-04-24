# Component Reference

All components are exported from the package root (`@aseguragonzalez/seedwork`).

---

## Domain layer

### `Entity<ID>`

- **Role:** Base class for DDD entities. Identity over attributes — two entities are equal when they share the same `id`, regardless of other properties.
- **Usage:** Extend with your entity class. The `id` property is `public readonly`. Pass the id to `super(id)`. Throws if `id` is falsy.
- **Key methods:** `equals(other: Entity<ID>): boolean` — delegates to `id.equals(otherId)` when `id` has an `equals` method (e.g. `TypedId`), falls back to `===` otherwise.

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
  - `withEvent(event: DomainEvent): this` — `protected`; returns a shallow clone of the aggregate with the event appended. Uses `Object.create(proto) + Object.assign` so the clone preserves the subclass prototype chain and all own properties.
  - `getDomainEvents(): ReadonlyArray<DomainEvent>` — pure read; returns a copy of the current event list. Calling it twice returns the same events. Has no side effects.

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
const account = await repository.getById(id);
const updated = account.deposit(amount); // returns new instance with event
await eventBus.publish([...updated.getDomainEvents()]);
await repository.save(updated);
```

**Note on `withEvent` vs explicit constructor:** `withEvent` is useful when a behavior method only records an event without changing other state. When you also need to update domain properties (e.g. `balance`), thread the new values explicitly through the constructor as shown above.

---

### `ValueObject`

- **Role:** Immutable object defined entirely by its attributes. Two value objects are equal when all their properties are equal.
- **Usage:** Extend and keep all properties `readonly`. Call `super()` from your constructor. Validate in the constructor and throw `ValueError` on invalid state.
- **Supported property types in `equals`:** primitives (`===`), nested `ValueObject` (recursive), `Date` (by timestamp), arrays of the previous types.
- **Key methods:** `equals(other: ValueObject): boolean`, `toString(): string` (auto-generated from property names and values).

```typescript
class Money extends ValueObject {
  constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {
    super();
    if (amount < 0) throw new ValueError('Amount cannot be negative');
  }
}
```

---

### `TypedId`

- **Role:** Branded string identity wrapper. One subclass per entity or event type ensures you cannot accidentally pass a `UserId` where an `OrderId` is expected.
- **Usage:** Extend and implement `validate()`. Add a `public constructor(value: string)` that calls `super(value)`. The `validate()` method is called inside `TypedId`'s constructor.
- **Key methods:** `equals(other: TypedId): boolean` — checks both `constructor` identity and `value`; `toString(): string`.

```typescript
class BankAccountId extends TypedId {
  public constructor(value: string) {
    super(value);
  }

  protected validate(): void {
    if (!this.value || this.value.trim() === '') {
      throw new ValueError('BankAccountId cannot be empty');
    }
  }
}
```

---

### `DomainEvent` / `BaseDomainEvent`

- **`DomainEvent`** — interface: `id: string`, `eventName: string`, `payload: Record<string, any>`, `occurredAt: Date`, `version: string`.
- **`BaseDomainEvent`** — abstract class implementing `DomainEvent`. All fields are `readonly`.
- **Usage:** Extend `BaseDomainEvent` per event type. Use a `private constructor` and a `static create(...)` factory. Name events in past tense. Keep payload serializable (primitives only).

```typescript
class MoneyDeposited extends BaseDomainEvent {
  static create(accountId: string, amount: Money): MoneyDeposited {
    return new MoneyDeposited(
      crypto.randomUUID(),
      'MoneyDeposited',
      { accountId, amount: amount.amount, currency: amount.currency },
      new Date(),
      '1.0.0'
    );
  }
  private constructor(id: string, eventName: string, payload: Record<string, any>, occurredAt: Date, version: string) {
    super(id, eventName, payload, occurredAt, version);
  }
}
```

---

### `Repository<ID, T>`

- **Role:** Collection-like port for an aggregate. Defined in the domain layer; implemented in infrastructure.
- **Methods:** `getById(id: ID): Promise<T | null>`, `save(entity: T): Promise<void>`, `delete(id: ID): Promise<void>`.
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

- **Role:** Base class for domain failures. Extends `Error`.
- **Constructor:** `(message: string, code: string = 'DOMAIN_ERROR', name: string = 'DomainError')`.
- **Usage:** Throw directly for general domain violations, or extend for named error types (e.g. `InsufficientFundsError`). Handlers and controllers should catch `DomainError` and map to an appropriate response.

---

### `ValueError`

- **Role:** Signals an invalid value object state. Extends `DomainError` with `code = 'VALUE_ERROR'` and `name = 'ValueError'`.
- **Usage:** Throw from `ValueObject` or `TypedId` constructors when validation fails.

---

### `Logger`

- **Role:** Cross-cutting logging port.
- **Methods:** `debug`, `info`, `warn`, `error`, `fatal`. Each takes `(message: string, ...extras)`.
- **Usage:** Inject into handlers or infrastructure implementations; implement with your logging library.

---

## Application layer

### `Command` / `CommandBus` / `CommandHandler`

- **`Command`** — marker interface; implemented by command DTOs.
- **`CommandHandler<TCommand>`** — `execute(command: TCommand): Promise<void>`.
- **`CommandBus`** — `dispatch(command: Command): Promise<void>`. The entry point for write operations.
- **Usage:** One command class and one handler per write use case. Commands carry intent and primitives — no domain objects at the port boundary when avoidable.

---

### `Query` / `QueryBus` / `QueryHandler` / `QueryResponse`

- **`Query`** — marker interface for query DTOs.
- **`QueryResponse<TProjection>`** — `{ data: TProjection }`. Subclass with a concrete `data` shape.
- **`QueryHandler<TQuery, TResult>`** — `execute(query: TQuery): Promise<TResult>`.
- **`QueryBus`** — `ask<TResult>(query: Query): Promise<TResult>`. Entry point for reads.
- **Usage:** One query class and one handler per read use case. Handlers return `QueryResponse` subtypes — never domain entities.

---

### `DomainEventBus` / `DomainEventHandler`

- **`DomainEventBus`** — `publish(events: DomainEvent[]): Promise<void>`, `subscribe(eventType: string, handlers: DomainEventHandler[]): void`.
- **`DomainEventHandler<TEvent>`** — `handle(event: TEvent): Promise<void>`.
- **Usage:** Handlers subscribe by `eventName` string. The command handler publishes collected events; the bus dispatches them to subscribers on `flush()` (when using `DeferredDomainEventBus`).

---

## Infrastructure layer

### `RegistryCommandBus`

- **Role:** `CommandBus` implementation. Routes commands to handlers via an in-process registry keyed by command constructor.
- **Usage:** `register(CommandClass, handler)` to wire handlers; `dispatch(command)` to execute.

```typescript
const commandBus = new RegistryCommandBus();
commandBus.register(OpenAccountCommand, new OpenAccountHandler(repo, eventBus));
```

---

### `RegistryQueryBus`

- **Role:** `QueryBus` implementation. Same registry pattern for queries.
- **Usage:** `register(QueryClass, handler)`; `ask(query)`.

---

### `TransactionalCommandBus`

- **Role:** `CommandBus` decorator. Wraps every dispatch in a `UnitOfWork` transaction: `createSession → dispatch → commit` on success, `rollback + rethrow` on error.
- **Usage:** Pass any `CommandBus` and a `UnitOfWork` implementation. Must be the **outermost** decorator in the stack.

```typescript
const bus = new TransactionalCommandBus(innerBus, unitOfWork);
```

---

### `DeferredDomainEventBus`

- **Role:** `DomainEventBus` implementation that buffers events on `publish()` and dispatches to subscribers only on `flush()`.
- **Usage:** Subscribe handlers by `eventName`. The bus accumulates events during command handling; `flush()` dispatches all buffered events, then clears the buffer. Suitable for monolithic applications where event dispatch should happen after a successful commit and you do not need a message broker.

```typescript
const eventBus = new DeferredDomainEventBus();
eventBus.subscribe('MoneyDeposited', [new UpdateBalanceProjectionHandler()]);
```

---

### `DomainEventFlushCommandBus`

- **Role:** `CommandBus` decorator. Calls `DeferredDomainEventBus.flush()` automatically after each successful `dispatch`.
- **Usage:** Wrap the inner command bus. Must be placed **inside** `TransactionalCommandBus` so the flush (and event handlers) run within the transaction.

---

### Canonical bus composition

```typescript
const commandBus = new TransactionalCommandBus(
  new DomainEventFlushCommandBus(new RegistryCommandBus(/* register handlers here */), deferredEventBus),
  unitOfWork
);
```

With this stack, each command dispatch:

1. Opens a transaction (`TransactionalCommandBus`)
2. Executes the handler (`RegistryCommandBus`)
3. Flushes deferred domain events — event handlers run within the transaction (`DomainEventFlushCommandBus`)
4. Commits on success, or rolls back and rethrows on error — no events are dispatched if the command fails
