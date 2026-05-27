# Getting Started

This guide walks through building a minimal bounded context with `@aseguragonzalez/ts-seedwork`. The running example is a bank account domain. For a complete, self-contained implementation exercising all building blocks, see [`examples/bank-account/`](examples/bank-account/).

## 1. Install

```bash
npm install @aseguragonzalez/ts-seedwork
```

Requires Node.js 22+ and TypeScript 6+.

## 2. Define a domain aggregate

Value objects provide structural equality. Aggregate roots accumulate domain events and return a new instance on every state change — never mutate `this`.

```typescript
import { AggregateRoot, BaseDomainEvent, TypedDomainEvent, ValueObject } from '@aseguragonzalez/ts-seedwork';

class AccountId extends ValueObject {
  constructor(public readonly value: string) {
    super();
    this.validate();
  }

  protected validate(): void {}
}

class AccountOpened extends BaseDomainEvent<{ accountId: string; balance: number }> {
  static create(accountId: string, balance: number) {
    return new AccountOpened({ accountId, balance });
  }
  private constructor(payload: { accountId: string; balance: number }) {
    super(payload);
  }
}

class BankAccount extends AggregateRoot<AccountId> {
  private constructor(
    id: AccountId,
    public readonly balance: number,
    events: ReadonlyArray<TypedDomainEvent<Record<string, unknown>>> = []
  ) {
    super(id, events);
    this.validate();
  }

  protected validate(): void {}

  static open(id: AccountId, initialBalance: number): BankAccount {
    const event = AccountOpened.create(id.value, initialBalance);
    return new BankAccount(id, initialBalance, [event]);
  }

  static reconstitute(id: AccountId, balance: number): BankAccount {
    return new BankAccount(id, balance); // no events — already published
  }
}
```

## 3. Define the repository interface

Repository interfaces live in the domain layer. Implementations belong in infrastructure.

```typescript
import { Repository } from '@aseguragonzalez/ts-seedwork';

interface BankAccountRepository extends Repository<AccountId, BankAccount> {}
```

## 4. Implement a command handler

Commands express write intentions. The handler's job is orchestration only: load the aggregate, call the domain method, save the result.

```typescript
import { Command, CommandHandler, ValidationErrorDetail, ValidationErrors } from '@aseguragonzalez/ts-seedwork';

class OpenAccountCommand extends Command {
  constructor(
    public readonly accountId: string,
    public readonly balance: number
  ) {
    super();
    this.validate();
  }

  protected validate(): void {
    const errors: ValidationErrorDetail[] = [];
    if (this.balance < 0) {
      errors.push({ code: 'INVALID_BALANCE', message: 'Balance cannot be negative' });
    }
    if (errors.length > 0) {
      throw new ValidationErrors(errors);
    }
  }
}

class OpenAccountHandler implements CommandHandler<OpenAccountCommand> {
  constructor(private readonly repository: BankAccountRepository) {}

  async execute(command: OpenAccountCommand): Promise<void> {
    const id = new AccountId(command.accountId);
    const account = BankAccount.open(id, command.balance);
    await this.repository.save(account); // publishes AccountOpened automatically
  }
}
```

## 5. Wire the bus

Use `CommandBusBuilder` at the composition root. Wrap the repository with `DomainEventPublishingRepository` so domain events are published transparently after every `save`. Builder declaration order sets the decorator stack — first declared is outermost.

```typescript
import { CommandBusBuilder, DomainEventPublishingRepository } from '@aseguragonzalez/ts-seedwork';

const repository = new DomainEventPublishingRepository(new BankAccountRepositoryImpl(), myEventPublisher);

const bus = new CommandBusBuilder()
  .register(OpenAccountCommand, new OpenAccountHandler(repository))
  .withTransaction(unitOfWork)
  .build();
```

## 6. Dispatch

Commands return `Result` — domain errors are caught and converted automatically.

```typescript
const result = await bus.dispatch(new OpenAccountCommand('acc-1', 1000));
if (result.isFailed()) {
  console.error(result.errors);
}
```

## Next steps

- [`examples/bank-account/`](examples/bank-account/) — complete bounded context exercising every building block end to end.
- [Component Reference](component-reference.md) — every class, interface, and infrastructure component with full API details.
- [Coding Standards](coding-standards.md) — conventions aligned with DDD and Clean Architecture.
