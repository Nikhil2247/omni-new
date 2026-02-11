// ============================================================================
// TIMEOUT INTERCEPTOR - Request Timeout Management
// ============================================================================
// NestJS interceptor to enforce request timeouts
// Prevents hung requests and ensures timely responses
// ============================================================================

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
  SetMetadata,
  Logger,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Observable, throwError, TimeoutError } from 'rxjs'
import { catchError, timeout } from 'rxjs/operators'

export const TIMEOUT_KEY = 'timeout'
export const NO_TIMEOUT_KEY = 'no-timeout'

/**
 * Decorator to set custom timeout for a route
 * @param milliseconds Timeout in milliseconds
 */
export const Timeout = (milliseconds: number) => SetMetadata(TIMEOUT_KEY, milliseconds)

/**
 * Decorator to disable timeout for a route
 */
export const NoTimeout = () => SetMetadata(NO_TIMEOUT_KEY, true)

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TimeoutInterceptor.name)
  private readonly defaultTimeout: number

  constructor(
    private readonly reflector: Reflector,
    defaultTimeout: number = 30000, // 30 seconds default
  ) {
    this.defaultTimeout = defaultTimeout
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Check if timeout is disabled for this route
    const noTimeout = this.reflector.getAllAndOverride<boolean>(NO_TIMEOUT_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (noTimeout) {
      return next.handle()
    }

    // Get custom timeout or use default
    const timeoutMs = this.reflector.getAllAndOverride<number>(TIMEOUT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? this.defaultTimeout

    const request = context.switchToHttp().getRequest()
    const method = request?.method || 'UNKNOWN'
    const url = request?.url || 'unknown'

    return next.handle().pipe(
      timeout(timeoutMs),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          this.logger.warn(`Request timeout: ${method} ${url} (${timeoutMs}ms)`)
          return throwError(() => new RequestTimeoutException(
            `Request timeout after ${timeoutMs}ms`,
          ))
        }
        return throwError(() => err)
      }),
    )
  }
}

// ============================================================================
// TIMEOUT SERVICE - Programmatic Timeout Utility
// ============================================================================

@Injectable()
export class TimeoutService {
  private readonly logger = new Logger(TimeoutService.name)

  /**
   * Execute a function with timeout
   */
  async execute<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    errorMessage?: string,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new TimeoutException(
            errorMessage || `Operation timed out after ${timeoutMs}ms`,
            timeoutMs,
          ),
        )
      }, timeoutMs)

      fn()
        .then((result) => {
          clearTimeout(timer)
          resolve(result)
        })
        .catch((error) => {
          clearTimeout(timer)
          reject(error)
        })
    })
  }

  /**
   * Execute with timeout and fallback
   */
  async executeWithFallback<T>(
    fn: () => Promise<T>,
    fallback: T | (() => T | Promise<T>),
    timeoutMs: number,
  ): Promise<T> {
    try {
      return await this.execute(fn, timeoutMs)
    } catch (error) {
      if (error instanceof TimeoutException) {
        this.logger.debug(`Timeout occurred, using fallback`)

        if (typeof fallback === 'function') {
          return (fallback as () => T | Promise<T>)()
        }
        return fallback
      }
      throw error
    }
  }

  /**
   * Race multiple promises with timeout
   */
  async race<T>(
    promises: Promise<T>[],
    timeoutMs: number,
    errorMessage?: string,
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new TimeoutException(
            errorMessage || `Race timed out after ${timeoutMs}ms`,
            timeoutMs,
          ),
        )
      }, timeoutMs)
    })

    return Promise.race([...promises, timeoutPromise])
  }

  /**
   * Execute all promises with individual timeouts
   */
  async allWithTimeout<T>(
    tasks: Array<{
      fn: () => Promise<T>
      timeoutMs: number
    }>,
  ): Promise<Array<{ success: boolean; result?: T; error?: Error }>> {
    return Promise.all(
      tasks.map(async (task) => {
        try {
          const result = await this.execute(task.fn, task.timeoutMs)
          return { success: true, result }
        } catch (error) {
          return { success: false, error: error as Error }
        }
      }),
    )
  }

  /**
   * Create a timeout wrapper for a function
   */
  wrap<T extends unknown[], R>(
    fn: (...args: T) => Promise<R>,
    timeoutMs: number,
  ): (...args: T) => Promise<R> {
    return (...args: T) => this.execute(() => fn(...args), timeoutMs)
  }
}

// ============================================================================
// TIMEOUT EXCEPTION
// ============================================================================

export class TimeoutException extends Error {
  constructor(
    message: string,
    public readonly timeoutMs: number,
  ) {
    super(message)
    this.name = 'TimeoutException'
  }
}

// ============================================================================
// TIMEOUT INTERCEPTOR FACTORY
// ============================================================================

export function createTimeoutInterceptor(
  reflector: Reflector,
  defaultTimeout?: number,
): TimeoutInterceptor {
  return new TimeoutInterceptor(reflector, defaultTimeout)
}
