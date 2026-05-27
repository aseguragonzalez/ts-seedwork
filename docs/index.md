---
layout: home

hero:
  name: ts-seedwork
  tagline: DDD and CQRS building blocks for TypeScript/Node applications. Zero runtime dependencies.
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: Component Reference
      link: /component-reference

features:
  - title: Domain Layer
    details: Entity, AggregateRoot, ValueObject, BaseDomainEvent, Repository, UnitOfWork, DomainError
  - title: Application Layer
    details: Command/CommandBus, Query/QueryBus, Result, Maybe, DomainEventBus, IntegrationEvent, BackgroundTask, TaskScheduler
  - title: Infrastructure Layer
    details: RegistryCommandBus, TransactionalCommandBus, DomainEventCoordinatorCommandBus, DeferredDomainEventBus, DomainEventPublishingRepository, CommandBusBuilder, QueryBusBuilder
---
