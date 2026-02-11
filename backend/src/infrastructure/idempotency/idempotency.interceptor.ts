// ============================================================================
// IDEMPOTENCY INTERCEPTOR - Automatic Request Deduplication
// ============================================================================
// Intercepts requests with idempotency keys and returns cached results
// ============================================================================

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
  Logger,
} from '@nestjs/common'
import { Observable, of } from 'rxjs'
import { tap, catchError } from 'rxjs/operators'
import { Reflector } from '@nestjs/core'
import { Request, Response } from 'express'
import { IdempotencyService, IdempotencyOptions } from './idempotency.service'
import { IDEMPOTENT_KEY } from './idempotency.decorator'

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name)

  constructor(
    private readonly idempotencyService: IdempotencyService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request>()
    const response = context.switchToHttp().getResponse<Response>()

    // Get decorator options
    const options = this.reflector.get<IdempotencyOptions>(IDEMPOTENT_KEY, context.getHandler())

    // Skip if not marked as idempotent
    if (!options) {
      return next.handle()
    }

    // Get idempotency key from header
    const idempotencyKey = request.headers['x-idempotency-key'] as string | undefined

    // If no idempotency key provided, proceed normally
    if (!idempotencyKey) {
      return next.handle()
    }

    // Validate idempotency key format (UUID-like or custom format)
    if (!this.isValidIdempotencyKey(idempotencyKey)) {
      this.logger.warn(`Invalid idempotency key format: ${idempotencyKey}`)
      return next.handle()
    }

    // Build a composite key including the request path and method
    const compositeKey = `${request.method}:${request.path}:${idempotencyKey}`

    // Check if this request has been processed before
    const existingResult = await this.idempotencyService.checkAndLock(compositeKey, options)

    if (existingResult.status === 'completed') {
      // Return the cached result
      this.logger.debug(`Returning cached result for idempotency key ${idempotencyKey}`)
      if (existingResult.statusCode) {
        response.status(existingResult.statusCode)
      }
      return of(existingResult.result)
    }

    if (existingResult.status === 'processing') {
      // Another request is currently processing this key
      throw new ConflictException(
        'A request with this idempotency key is currently being processed. Please retry later.',
      )
    }

    // Process the request and store the result
    return next.handle().pipe(
      tap(async (result) => {
        // Store the successful result
        await this.idempotencyService.storeResult(
          compositeKey,
          result,
          response.statusCode,
          options,
        )
      }),
      catchError(async (error) => {
        // Release the lock on error (don't cache errors)
        await this.idempotencyService.releaseLock(compositeKey, options)
        throw error
      }),
    )
  }

  private isValidIdempotencyKey(key: string): boolean {
    // Accept UUIDs, ULIDs, or any alphanumeric string up to 128 chars
    if (key.length > 128) return false
    return /^[a-zA-Z0-9\-_]+$/.test(key)
  }
}
