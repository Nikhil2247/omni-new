// ============================================================================
// RETRY SERVICE - Automatic Retry with Backoff
// ============================================================================
// Implements retry patterns with various backoff strategies
// Supports exponential, linear, and fixed backoff
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';

export type BackoffStrategy = 'fixed' | 'linear' | 'exponential' | 'jitter';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffStrategy?: BackoffStrategy;
  backoffMultiplier?: number;
  retryableErrors?: (new (...args: unknown[]) => Error)[];
  nonRetryableErrors?: (new (...args: unknown[]) => Error)[];
  onRetry?: (error: Error, attempt: number, delay: number) => void;
  shouldRetry?: (error: Error) => boolean;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDelayMs: number;
}

const defaultOptions: Required<
  Omit<
    RetryOptions,
    'onRetry' | 'shouldRetry' | 'retryableErrors' | 'nonRetryableErrors'
  >
> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffStrategy: 'exponential',
  backoffMultiplier: 2,
};

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);

  /**
   * Execute a function with automatic retry
   */
  async execute<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
    const opts = { ...defaultOptions, ...options };
    let lastError: Error | undefined;
    let attempt = 0;
    let totalDelayMs = 0;

    while (attempt < opts.maxAttempts) {
      attempt++;

      try {
        const result = await fn();

        if (attempt > 1) {
          this.logger.debug(`Retry succeeded on attempt ${attempt}`);
        }

        return result;
      } catch (error) {
        lastError = error as Error;

        // Check if error is retryable
        if (!this.isRetryable(lastError, opts)) {
          this.logger.debug(
            `Non-retryable error encountered: ${lastError.message}`,
          );
          throw lastError;
        }

        // Check if we have more attempts
        if (attempt >= opts.maxAttempts) {
          this.logger.warn(`All ${opts.maxAttempts} retry attempts exhausted`);
          throw lastError;
        }

        // Calculate delay
        const delay = this.calculateDelay(attempt, opts);
        totalDelayMs += delay;

        // Call onRetry callback if provided
        if (opts.onRetry) {
          opts.onRetry(lastError, attempt, delay);
        }

        this.logger.debug(
          `Retry attempt ${attempt}/${opts.maxAttempts} failed, waiting ${delay}ms: ${lastError.message}`,
        );

        // Wait before next attempt
        await this.sleep(delay);
      }
    }

    throw lastError || new Error('Retry failed without error');
  }

  /**
   * Execute with retry and return detailed result
   */
  async executeWithResult<T>(
    fn: () => Promise<T>,
    options?: RetryOptions,
  ): Promise<RetryResult<T>> {
    const opts = { ...defaultOptions, ...options };
    let lastError: Error | undefined;
    let attempt = 0;
    let totalDelayMs = 0;

    while (attempt < opts.maxAttempts) {
      attempt++;

      try {
        const result = await fn();

        return {
          success: true,
          result,
          attempts: attempt,
          totalDelayMs,
        };
      } catch (error) {
        lastError = error as Error;

        if (!this.isRetryable(lastError, opts) || attempt >= opts.maxAttempts) {
          return {
            success: false,
            error: lastError,
            attempts: attempt,
            totalDelayMs,
          };
        }

        const delay = this.calculateDelay(attempt, opts);
        totalDelayMs += delay;

        if (opts.onRetry) {
          opts.onRetry(lastError, attempt, delay);
        }

        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: lastError,
      attempts: attempt,
      totalDelayMs,
    };
  }

  /**
   * Create a retry wrapper for a function
   */
  wrap<T extends unknown[], R>(
    fn: (...args: T) => Promise<R>,
    options?: RetryOptions,
  ): (...args: T) => Promise<R> {
    return (...args: T) => this.execute(() => fn(...args), options);
  }

  /**
   * Retry with exponential backoff (convenience method)
   */
  async exponential<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    initialDelayMs: number = 1000,
  ): Promise<T> {
    return this.execute(fn, {
      maxAttempts,
      initialDelayMs,
      backoffStrategy: 'exponential',
    });
  }

  /**
   * Retry with fixed delay (convenience method)
   */
  async fixed<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delayMs: number = 1000,
  ): Promise<T> {
    return this.execute(fn, {
      maxAttempts,
      initialDelayMs: delayMs,
      backoffStrategy: 'fixed',
    });
  }

  /**
   * Retry with linear backoff (convenience method)
   */
  async linear<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    initialDelayMs: number = 1000,
  ): Promise<T> {
    return this.execute(fn, {
      maxAttempts,
      initialDelayMs,
      backoffStrategy: 'linear',
    });
  }

  private isRetryable(error: Error, options: RetryOptions): boolean {
    // Check custom shouldRetry function
    if (options.shouldRetry) {
      return options.shouldRetry(error);
    }

    // Check non-retryable errors list
    if (options.nonRetryableErrors && options.nonRetryableErrors.length > 0) {
      for (const ErrorClass of options.nonRetryableErrors) {
        if (error instanceof ErrorClass) {
          return false;
        }
      }
    }

    // Check retryable errors list (if specified, only retry those)
    if (options.retryableErrors && options.retryableErrors.length > 0) {
      for (const ErrorClass of options.retryableErrors) {
        if (error instanceof ErrorClass) {
          return true;
        }
      }
      return false;
    }

    // Default: all errors are retryable
    return true;
  }

  private calculateDelay(
    attempt: number,
    options: Required<
      Omit<
        RetryOptions,
        'onRetry' | 'shouldRetry' | 'retryableErrors' | 'nonRetryableErrors'
      >
    >,
  ): number {
    let delay: number;

    switch (options.backoffStrategy) {
      case 'fixed':
        delay = options.initialDelayMs;
        break;

      case 'linear':
        delay = options.initialDelayMs * attempt;
        break;

      case 'exponential':
        delay =
          options.initialDelayMs *
          Math.pow(options.backoffMultiplier, attempt - 1);
        break;

      case 'jitter':
        // Exponential with random jitter
        const exponentialDelay =
          options.initialDelayMs *
          Math.pow(options.backoffMultiplier, attempt - 1);
        const jitter = Math.random() * exponentialDelay * 0.5; // Up to 50% jitter
        delay = exponentialDelay + jitter;
        break;

      default:
        delay = options.initialDelayMs;
    }

    // Apply max delay cap
    return Math.min(delay, options.maxDelayMs);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
