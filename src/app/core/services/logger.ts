import { Injectable, isDevMode } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  /**
   * Log an informational message (in dev mode only)
   */
  info(message: string, ...optionalParams: unknown[]): void {
    if (isDevMode()) {
      console.info(`[INFO] ${message}`, ...optionalParams);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...optionalParams: unknown[]): void {
    console.warn(`[WARN] ${message}`, ...optionalParams);
  }

  /**
   * Log an error message with error details
   */
  error(message: string, error?: unknown, ...optionalParams: unknown[]): void {
    console.error(`[ERROR] ${message}`, error ?? '', ...optionalParams);
  }

  /**
   * Log a debug message (dev mode only)
   */
  debug(message: string, ...optionalParams: unknown[]): void {
    if (isDevMode()) {
      console.debug(`[DEBUG] ${message}`, ...optionalParams);
    }
  }
}
