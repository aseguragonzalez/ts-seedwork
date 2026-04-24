export interface UnitOfWork {
  createSession(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}
