export interface ApplicationRequest {
  validate(): void;
}

export interface ApplicationService<TRequest extends ApplicationRequest, TResponse> {
  execute(request: TRequest): Promise<TResponse>;
}
