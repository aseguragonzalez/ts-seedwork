export interface Logger {
  debug(message: string, extra?: Record<string, any>): void;
  info(message: string, extra?: Record<string, any>): void;
  warn(message: string, extra?: Record<string, any>): void;
  error(message: string, error: Error, extra?: Record<string, any>): void;
  fatal(message: string, error: Error, extra?: Record<string, any>): void;
}
