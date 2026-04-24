export class DomainError extends Error {
  public constructor(
    message: string,
    public readonly code: string = 'DOMAIN_ERROR',
    public readonly name: string = 'DomainError'
  ) {
    super(message);
  }
}
