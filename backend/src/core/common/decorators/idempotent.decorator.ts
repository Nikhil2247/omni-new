// ============================================================================
// IDEMPOTENT DECORATOR - Idempotency Key Support
// ============================================================================
// Decorator and guard for handling idempotent requests
// ============================================================================

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ConflictException,
  SetMetadata,
  Inject,
  Optional,
  Logger,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

export const IDEMPOTENT_KEY = 'idempotent'
export const IDEMPOTENT_TTL_KEY = 'idempotentTtl'

// In-memory storage for development (use Redis in production)
const idempotencyStore = new Map<string, { response: any; expiresAt: number }>()

/**
 * Mark a route as idempotent
 * Requires 'X-Idempotency-Key' header in requests
 * @param ttl - Time in seconds to remember the request (default: 86400 / 24 hours)
 */
export function Idempotent(ttl: number = 86400) {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    SetMetadata(IDEMPOTENT_KEY, true)(target, propertyKey!, descriptor!)
    SetMetadata(IDEMPOTENT_TTL_KEY, ttl)(target, propertyKey!, descriptor!)
  }
}

@Injectable()
export class IdempotencyGuard implements CanActivate {
  private readonly logger = new Logger(IdempotencyGuard.name)

  constructor(
    private readonly reflector: Reflector,
    @Optional() @Inject('REDIS_CLIENT') private readonly redisClient?: any,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isIdempotent = this.reflector.get<boolean>(IDEMPOTENT_KEY, context.getHandler())

    if (!isIdempotent) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const idempotencyKey = request.headers['x-idempotency-key']

    if (!idempotencyKey) {
      // Allow request but log warning
      this.logger.warn('Idempotent endpoint called without X-Idempotency-Key header')
      return true
    }

    const userId = request.user?.id || 'anonymous'
    const fullKey = `idempotent:${userId}:${idempotencyKey}`

    // Check for existing response
    const existing = await this.getStoredResponse(fullKey)
    if (existing) {
      this.logger.debug(`Returning cached idempotent response for key: ${idempotencyKey}`)
      // Attach cached response to request for interceptor to use
      request.idempotentResponse = existing
      throw new ConflictException({
        message: 'Request already processed',
        idempotencyKey,
        originalResponse: existing,
      })
    }

    // Store the key to prevent concurrent duplicate processing
    request.idempotencyKey = fullKey
    request.idempotencyTtl = this.reflector.get<number>(
      IDEMPOTENT_TTL_KEY,
      context.getHandler(),
    ) || 86400

    return true
  }

  private async getStoredResponse(key: string): Promise<any | null> {
    if (this.redisClient) {
      try {
        const data = await this.redisClient.get(key)
        return data ? JSON.parse(data) : null
      } catch (error) {
        this.logger.warn(`Redis get error: ${error}`)
        return null
      }
    }

    const entry = idempotencyStore.get(key)
    if (entry && entry.expiresAt > Date.now()) {
      return entry.response
    }
    idempotencyStore.delete(key)
    return null
  }
}

// Helper to store idempotent response after successful processing
export async function storeIdempotentResponse(
  key: string,
  response: any,
  ttl: number,
  redisClient?: any,
): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.setex(key, ttl, JSON.stringify(response))
    } catch (error) {
      console.warn(`Redis set error: ${error}`)
    }
    return
  }

  idempotencyStore.set(key, {
    response,
    expiresAt: Date.now() + ttl * 1000,
  })
}
