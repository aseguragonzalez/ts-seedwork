export interface Logger {
  debug(message: string, extra?: Record<string, unknown>): void;
  info(message: string, extra?: Record<string, unknown>): void;
  warn(message: string, extra?: Record<string, unknown>): void;
  error(message: string, error: Error, extra?: Record<string, unknown>): void;
  fatal(message: string, error: Error, extra?: Record<string, unknown>): void;
}
