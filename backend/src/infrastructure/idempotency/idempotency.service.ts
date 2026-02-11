// ============================================================================
// IDEMPOTENCY SERVICE - Request Deduplication Logic
// ============================================================================
// Manages idempotency keys, result caching, and duplicate detection
// ============================================================================

import { Injectable, Logger } from '@nestjs/common'
import { DragonflyService } from '../cache/dragonfly.service'

export interface IdempotencyResult<T = unknown> {
  status: 'new' | 'processing' | 'completed'
  result?: T
  statusCode?: number
  createdAt?: string
  completedAt?: string
}

export interface IdempotencyOptions {
  /** TTL in seconds for the idempotency key (default: 86400 = 24 hours) */
  ttl?: number
  /** Key prefix for namespacing (default: 'idempotency') */
  prefix?: string
  /** Lock TTL in seconds for in-flight requests (default: 60) */
  lockTtl?: number
}

const DEFAULT_TTL = 86400 // 24 hours
const DEFAULT_LOCK_TTL = 60 // 1 minute
const DEFAULT_PREFIX = 'idempotency'

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name)

  constructor(private readonly cache: DragonflyService) {}

  /**
   * Check if a request with this idempotency key has been processed
   * Returns the cached result if available, or marks it as processing
   */
  async checkAndLock<T>(
    idempotencyKey: string,
    options: IdempotencyOptions = {},
  ): Promise<IdempotencyResult<T>> {
    const { prefix = DEFAULT_PREFIX, lockTtl = DEFAULT_LOCK_TTL } = options
    const key = this.buildKey(prefix, idempotencyKey)
    const lockKey = `${key}:lock`

    try {
      // First, check if we have a completed result
      const existingResult = await this.cache.get<IdempotencyResult<T>>(key)

      if (existingResult) {
        if (existingResult.status === 'completed') {
          this.logger.debug(`Idempotency key ${idempotencyKey} found with completed result`)
          return existingResult
        }

        if (existingResult.status === 'processing') {
          // Another request is currently processing this key
          this.logger.debug(`Idempotency key ${idempotencyKey} is currently being processed`)
          return { status: 'processing' }
        }
      }

      // Try to acquire a lock
      const lockAcquired = await this.cache.set(
        lockKey,
        { lockedAt: new Date().toISOString() },
        { ttl: lockTtl, nx: true },
      )

      if (!lockAcquired) {
        // Another request acquired the lock
        this.logger.debug(`Failed to acquire lock for idempotency key ${idempotencyKey}`)
        return { status: 'processing' }
      }

      // Mark as processing
      await this.cache.set<IdempotencyResult>(
        key,
        {
          status: 'processing',
          createdAt: new Date().toISOString(),
        },
        { ttl: lockTtl },
      )

      this.logger.debug(`Idempotency key ${idempotencyKey} locked for processing`)
      return { status: 'new' }
    } catch (error) {
      this.logger.error(`Error checking idempotency key ${idempotencyKey}:`, error)
      // On error, allow the request to proceed (fail open)
      return { status: 'new' }
    }
  }

  /**
   * Store the result of a processed request
   */
  async storeResult<T>(
    idempotencyKey: string,
    result: T,
    statusCode: number,
    options: IdempotencyOptions = {},
  ): Promise<void> {
    const { prefix = DEFAULT_PREFIX, ttl = DEFAULT_TTL } = options
    const key = this.buildKey(prefix, idempotencyKey)
    const lockKey = `${key}:lock`

    try {
      const idempotencyResult: IdempotencyResult<T> = {
        status: 'completed',
        result,
        statusCode,
        completedAt: new Date().toISOString(),
      }

      await this.cache.set(key, idempotencyResult, { ttl })

      // Release the lock
      await this.cache.delete(lockKey)

      this.logger.debug(`Stored result for idempotency key ${idempotencyKey}`)
    } catch (error) {
      this.logger.error(`Error storing result for idempotency key ${idempotencyKey}:`, error)
    }
  }

  /**
   * Release a lock without storing a result (on error)
   */
  async releaseLock(idempotencyKey: string, options: IdempotencyOptions = {}): Promise<void> {
    const { prefix = DEFAULT_PREFIX } = options
    const key = this.buildKey(prefix, idempotencyKey)
    const lockKey = `${key}:lock`

    try {
      await this.cache.delete(key)
      await this.cache.delete(lockKey)
      this.logger.debug(`Released lock for idempotency key ${idempotencyKey}`)
    } catch (error) {
      this.logger.error(`Error releasing lock for idempotency key ${idempotencyKey}:`, error)
    }
  }

  /**
   * Check if a key exists (without locking)
   */
  async exists(idempotencyKey: string, options: IdempotencyOptions = {}): Promise<boolean> {
    const { prefix = DEFAULT_PREFIX } = options
    const key = this.buildKey(prefix, idempotencyKey)
    return this.cache.exists(key)
  }

  /**
   * Get the current status of an idempotency key
   */
  async getStatus<T>(
    idempotencyKey: string,
    options: IdempotencyOptions = {},
  ): Promise<IdempotencyResult<T> | null> {
    const { prefix = DEFAULT_PREFIX } = options
    const key = this.buildKey(prefix, idempotencyKey)
    return this.cache.get<IdempotencyResult<T>>(key)
  }

  /**
   * Manually invalidate an idempotency key
   */
  async invalidate(idempotencyKey: string, options: IdempotencyOptions = {}): Promise<void> {
    const { prefix = DEFAULT_PREFIX } = options
    const key = this.buildKey(prefix, idempotencyKey)
    const lockKey = `${key}:lock`

    await this.cache.delete(key)
    await this.cache.delete(lockKey)
    this.logger.debug(`Invalidated idempotency key ${idempotencyKey}`)
  }

  private buildKey(prefix: string, idempotencyKey: string): string {
    return `${prefix}:${idempotencyKey}`
  }
}
