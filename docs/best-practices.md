# Best Practices

This guide explains how to use the seedwork package effectively.

## Aggregate design

**Keep aggregates small.** Prefer a focused consistency boundary over a large object graph. Small aggregates are easier to reason about, test, and serialize.

**Reference other aggregates by ID only.** Never hold object references to other aggregate roots. Cross-aggregate operations are coordinated in the application layer (load both, call behavior on each, save both).

**Enforce invariants inside the root.** All rules that must always hold (e.g. `balance >= 0`, required fields) should be checked inside the aggregate constructor or behavior methods. Throw a `DomainError` subclass on violation — never allow invalid state to be constructed.

**Behavior methods return a new instance.** Do not mutate `this`. Compute the new state, construct a new aggregate instance carrying the updated properties and the appended event, and return it. The handler saves the returned instance.

```typescript
// Correct — returns a new instance
deposit(amount: Money): BankAccount {
  const event = MoneyDeposited.create(this.id.value, amount);
  return new BankAccount(this.id, this.balance.add(amount), [...this.getDomainEvents(), event]);
}

// Wrong — mutates this
deposit(amount: Money): void {
  this.balance = this.balance.add(amount); // don't do this
}
```

**Reconstitute without events.** When loading an aggregate from persistence, use a `static reconstitute(...)` factory that passes no events — those have already been published. This ensures each command execution starts with a clean event slate.

```typescript
static reconstitute(id: BankAccountId, balance: Money): BankAccount {
  return new BankAccount(id, balance); // no events
}
```

---

## Commands and handlers

**One command class per write use case.** The handler's job is orchestration: load the aggregate, call the domain method, save. Keep all business logic inside the aggregate.

**Handler pattern:**

```typescript
class AccountNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Account ${id} not found`, 'ACCOUNT_NOT_FOUND');
  }
}

async execute(command: DepositMoneyCommand): Promise<void> {
  const id = new BankAccountId(command.accountId);
  const account = await this.repository.findById(id);
  if (!account) throw new AccountNotFoundError(command.accountId);

  const amount = new Money(command.amount, command.currency);
  const updated = account.deposit(amount);

  await this.repository.save(updated); // DomainEventPublishingRepository publishes events automatically
}
```

**Stack buses in the canonical order.** Use `CommandBusBuilder` to assemble the stack. Declare `.withValidation()` before `.withTransaction()` so validation errors never open a transaction:

```typescript
const bus = new CommandBusBuilder()
  .register(DepositMoneyCommand, new DepositMoneyHandler(repository))
  .withValidation() // outermost — validate before opening a transaction
  .withTransaction(unitOfWork)
  .build();
```

**Handle domain failures with `Result.fail`.** `RegistryCommandBus` catches `DomainError` thrown by handlers and converts it to `Result.fail`. Infrastructure failures (timeouts, connection drops) propagate as thrown errors — do not wrap them in `Result`.

```typescript
const result = await bus.dispatch(command);
if (result.isFail()) {
  return res.status(422).json({ errors: result.errors });
}
```

---

## Domain events

**Record events when something meaningful happens.** Append a domain event in the aggregate whenever a state change has business significance. Name events in past tense (`MoneyDeposited`, `AccountOpened`).

**Keep event payloads serializable.** Use primitives only in `payload`. Do not embed `ValueObject` instances or aggregate references — serialize their scalar values instead.

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

**Event publishing is transparent.** Do not inject `DomainEventPublisher` into command handlers. Wrap the repository with `DomainEventPublishingRepository` at composition time — it calls `publisher.publish(entity.getDomainEvents())` after every `save`, keeping handlers free of event-publishing logic.

```typescript
const repository = new DomainEventPublishingRepository(new BankAccountRepositoryImpl(), myEventPublisher);
```

**`getDomainEvents()` is a pure read.** No side effects. Calling it multiple times returns the same events. Never clear events manually.

---

## Queries and read model

**Return plain DTOs — never domain entities.** Query handlers should return plain TypeScript interfaces or classes with primitive or simple fields. Map from the aggregate or a projection to the response type inside the handler.

```typescript
interface BalanceResponse {
  accountId: string;
  balance: number;
  currency: string;
}

class GetBalanceHandler implements QueryHandler<GetBalanceQuery, BalanceResponse> {
  async execute(query: GetBalanceQuery): Promise<Maybe<BalanceResponse>> {
    const account = await this.repository.findById(new BankAccountId(query.accountId));
    if (!account) return Maybe.nothing();
    return Maybe.just({
      accountId: query.accountId,
      balance: account.balance.amount,
      currency: account.balance.currency,
    });
  }
}
```

**Keep query handlers read-only.** Do not dispatch commands or change state inside a query handler. Queries are for reading; commands are for writing.

**Use `Maybe.nothing()` for absence and authorization failures.** Never reveal whether a resource exists to an unauthorized caller.

```typescript
const result = await queryBus.ask<BalanceResponse>(new GetBalanceQuery(id));
if (result.isNothing()) return res.status(404).send();
return res.json(result.value);
```

---

## Dependency direction

This is the only rule that must never be broken:

- **Domain layer** — no imports from application or infrastructure. Pure TypeScript, no framework, no database, no HTTP.
- **Application layer** — depends on domain types and interface ports only. No concrete infrastructure.
- **Infrastructure layer** — implements domain/application interfaces and depends inward. Never imported by domain or application.

```
Domain ← Application ← Infrastructure
```

---

## Testing

**Domain: unit test aggregates and value objects directly.** No mocks needed. Test that behavior methods produce the expected new state, throw on invariant violations, and emit the right events.

```typescript
it('emits MoneyDeposited on deposit', () => {
  const account = BankAccount.open(id, eur(100)).deposit(eur(50));
  expect(account.getDomainEvents()[1]).toBeInstanceOf(MoneyDeposited);
  expect(account.balance).toEqual(eur(150));
});
```

**Handlers: test with in-memory fakes.** Use `InMemoryRepository` implementations and a stub `DomainEventPublisher`. Assert that the handler saves the correct aggregate state. See `tests/fixtures/bank-account/tests/` for complete examples.

**Integration: wire real buses and in-memory repositories** to validate the full stack (`ValidationCommandBus → TransactionalCommandBus → RegistryCommandBus`) when you need to verify bus composition.

---

## Summary

| Area         | Practice                                                                                 |
| ------------ | ---------------------------------------------------------------------------------------- |
| Aggregates   | Small; reference others by ID; enforce invariants; behavior methods return new instances |
| Commands     | Thin handlers — orchestration only; load → domain → save                                 |
| Bus stack    | `ValidationCommandBus → TransactionalCommandBus → RegistryCommandBus`                    |
| Events       | Past-tense names; serializable payload; published transparently by repository decorator  |
| Queries      | Return plain TS DTOs; no side effects; no commands in query handlers                     |
| Dependencies | Domain pure; application uses ports; infrastructure implements and points inward         |
| Testing      | Unit test domain directly; test handlers with in-memory fakes                            |
