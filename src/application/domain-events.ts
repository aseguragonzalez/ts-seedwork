import { DomainEvent } from '../domain/domain-event.js';

export interface DomainEventHandler<TEvent extends DomainEvent = DomainEvent> {
  handle(event: TEvent): Promise<void>;
}
