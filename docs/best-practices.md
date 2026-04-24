# Best Practices

This guide explains how to use the seedwork package effectively.

## Aggregate design

**Keep aggregates small.** Prefer a focused consistency boundary over a large object graph. Small aggregates are easier to reason about, test, and serialize.

**Reference other aggregates by `TypedId` only.** Never hold object references to other aggregate roots. Cross-aggregate operations are coordinated in the application layer (load both, call behavior on each, save both).

**Enforce invariants inside the root.** All rules that must always hold (e.g. `balance >= 0`, required fields) should be checked inside the aggregate constructor or behavior methods. Throw `DomainError` or `ValueError` on violation — never allow invalid state to be constructed.

**Behavior methods return a new instance.** Do not mutate `this` and then emit an event. Instead, compute the new state, construct a new aggregate instance carrying the updated properties and the appended event, and return it. The handler saves the returned instance.

```typescript
// Correct — returns a new instance
deposit(amount: Money): BankAccount {
  const event = MoneyDeposited.create(this.id.value, amount);
  return new BankAccount(this.id, this.owner, this.balance.add(amount), [
    ...this.getDomainEvents(), event
  ]);
}

// Wrong — mutates this
deposit(amount: Money): void {
  this.balance = this.balance.add(amount); // don't do this
}
```

**Use `withEvent` for event-only operations.** When a behavior method records an event but does not change other aggregate properties, use the inherited `withEvent` helper — it clones the aggregate and appends the event in one step.

```typescript
lock(): BankAccount {
  return this.withEvent(AccountLocked.create(this.id.value));
}
```

---

## Commands and handlers

**One command class per write use case.** The handler's job is orchestration: load the aggregate, call the domain method, publish events, save. Keep all business logic inside the aggregate.

**Handler pattern:**

```typescript
async execute(command: DepositMoneyCommand): Promise<void> {
  const id = new BankAccountId(command.accountId);
  const account = await this.repository.getById(id);
  if (!account) throw new DomainError(`Account ${command.accountId} not found`, 'NOT_FOUND');

  const amount = new Money(command.amount, command.currency);
  const updated = account.deposit(amount);

  await this.eventBus.publish([...updated.getDomainEvents()]);
  await this.repository.save(updated);
}
```

**Stack buses in the canonical order:** `TransactionalCommandBus → DomainEventFlushCommandBus → RegistryCommandBus`. The transaction wraps both the command and the event flush. If the handler throws, the transaction rolls back and no events are dispatched.

---

## Domain events

**Record events when something meaningful happens.** Append a domain event in the aggregate whenever a state change has business significance. Name events in past tense (`MoneyDeposited`, `AccountOpened`, not `DepositMoney`).

**Keep event payloads serializable.** Use primitives only in `payload`. Do not embed `ValueObject` instances or aggregate references — serialize their scalar values instead.

**Use `DeferredDomainEventBus` in monolithic applications.** Events are buffered during command handling and dispatched only on `flush()`. This means:

- Events are never dispatched for rolled-back work.
- Event handlers run within the same transaction (when composed with `DomainEventFlushCommandBus` inside `TransactionalCommandBus`).
- No message broker is needed for intra-process bounded-context integration.

Prefer this bus for **single-database, API or MVC applications** where the incoming request is the transaction boundary. For cross-service or async integration, use a message broker and a different bus implementation.

**Call `getDomainEvents()` once, at the end.** In a handler, call `getDomainEvents()` on the final aggregate state (the result of the last behavior call) before publishing. `getDomainEvents()` is a pure read — calling it multiple times is safe.

**Design event handlers for a single concern.** One handler per event type and concern (e.g. update read model, send notification). If the bus may redeliver events (async), design handlers to be idempotent.

---

## Queries and read model

**Return `QueryResponse` DTOs — never domain entities.** Query handlers should return `QueryResponse` subtypes with primitive or simple fields. Map from the aggregate or a projection to the response DTO inside the handler.

**Keep query handlers read-only.** Do not dispatch commands or change state inside a query handler. Queries are for reading; commands are for writing.

**Implement read-side repositories in infrastructure.** Load aggregates or projections in the handler by going through a repository interface. The query handler should not depend on ORM internals or database types.

---

## Dependency direction

This is the only rule that must never be broken:

- **Domain layer** — no imports from application or infrastructure. Pure TypeScript, no framework, no database, no HTTP.
- **Application layer** — depends on domain types and interface ports only. No concrete infrastructure.
- **Infrastructure layer** — implements domain/application interfaces and depends inward. Never imported by domain or application.

```
Domain ← Application ← Infrastructure
```

Dependency arrows point from infrastructure toward the domain, not the other way around.

---

## Testing

**Domain: unit test aggregates and value objects directly.** No mocks needed. Test that behavior methods produce the expected new state, throw on invariant violations, and emit the right events. Use `getDomainEvents()` to assert emitted events.

```typescript
it('emits MoneyDeposited on deposit', () => {
  const account = BankAccount.open(id, 'Alice', eur(100)).deposit(eur(50));
  expect(account.getDomainEvents()[1]).toBeInstanceOf(MoneyDeposited);
  expect(account.balance).toEqual(eur(150));
});
```

**Handlers: test with in-memory fakes.** Use `InMemoryRepository` implementations and a real (or fake) `DeferredDomainEventBus`. Assert that the handler saves the correct aggregate state and publishes the expected events. See `tests/fixtures/bank-account/tests/` for complete examples.

**Integration: wire real buses and in-memory repositories** to validate the full stack (`TransactionalCommandBus + DomainEventFlushCommandBus + RegistryCommandBus`) when you need to verify bus composition.

---

## Summary

| Area         | Practice                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------- |
| Aggregates   | Small; reference others by `TypedId`; enforce invariants; behavior methods return new instances |
| Commands     | Thin handlers — orchestration only; load → domain → publish events → save                       |
| Bus stack    | `TransactionalCommandBus → DomainEventFlushCommandBus → RegistryCommandBus`                     |
| Events       | Past-tense names; serializable payload; deferred flush after command; one concern per handler   |
| Queries      | Return `QueryResponse` DTOs; no side effects; no commands in query handlers                     |
| Dependencies | Domain pure; application uses ports; infrastructure implements and points inward                |
| Testing      | Unit test domain directly; test handlers with in-memory fakes                                   |
