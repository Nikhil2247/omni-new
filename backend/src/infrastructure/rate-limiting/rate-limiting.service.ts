// ============================================================================
// RATE LIMITING SERVICE - Distributed Rate Limiting Logic
// ============================================================================
// Uses Redis sliding window algorithm for accurate, distributed rate limiting
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { DragonflyService } from '../cache/dragonfly.service';

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  window: number;
  /** Key prefix for namespacing */
  prefix?: string;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of requests remaining in the current window */
  remaining: number;
  /** Total limit for the window */
  limit: number;
  /** Seconds until the window resets */
  resetIn: number;
  /** Number of requests made in the current window */
  current: number;
}

const DEFAULT_PREFIX = 'ratelimit';

@Injectable()
export class RateLimitingService {
  private readonly logger = new Logger(RateLimitingService.name);

  constructor(private readonly cache: DragonflyService) {}

  /**
   * Check if a request is allowed under the rate limit using sliding window
   */
  async checkLimit(
    identifier: string,
    config: RateLimitConfig,
  ): Promise<RateLimitResult> {
    const { limit, window, prefix = DEFAULT_PREFIX } = config;
    const key = `${prefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - window * 1000;

    try {
      const client = this.cache.getClient();
      const pipeline = client.pipeline();

      // Remove old entries outside the window
      pipeline.zremrangebyscore(key, 0, windowStart);

      // Count current entries in the window
      pipeline.zcard(key);

      // Add current request with timestamp as score
      pipeline.zadd(key, now, `${now}:${Math.random().toString(36).slice(2)}`);

      // Set expiry on the key
      pipeline.expire(key, window);

      const results = await pipeline.exec();

      // Get the count before adding current request
      const currentCount = (results?.[1]?.[1] as number) || 0;
      const allowed = currentCount < limit;
      const remaining = Math.max(0, limit - currentCount - (allowed ? 1 : 0));

      // Calculate reset time
      const oldestEntry = await client.zrange(key, 0, 0, 'WITHSCORES');
      const oldestTimestamp =
        oldestEntry.length >= 2 ? parseInt(oldestEntry[1], 10) : now;
      const resetIn = Math.ceil((oldestTimestamp + window * 1000 - now) / 1000);

      return {
        allowed,
        remaining,
        limit,
        resetIn: Math.max(0, resetIn),
        current: currentCount + (allowed ? 1 : 0),
      };
    } catch (error) {
      this.logger.error(`Rate limit check failed for ${identifier}:`, error);
      // Fail open - allow the request if Redis is down
      return {
        allowed: true,
        remaining: limit,
        limit,
        resetIn: window,
        current: 0,
      };
    }
  }

  /**
   * Simple fixed window rate limiting (faster but less accurate)
   */
  async checkLimitFixed(
    identifier: string,
    config: RateLimitConfig,
  ): Promise<RateLimitResult> {
    const { limit, window, prefix = DEFAULT_PREFIX } = config;
    const windowKey = Math.floor(Date.now() / (window * 1000));
    const key = `${prefix}:${identifier}:${windowKey}`;

    try {
      const current = await this.cache.incr(key);

      // Set expiry on first request
      if (current === 1) {
        await this.cache.expire(key, window);
      }

      const allowed = current <= limit;
      const remaining = Math.max(0, limit - current);
      const ttl = await this.cache.ttl(key);

      return {
        allowed,
        remaining,
        limit,
        resetIn: ttl > 0 ? ttl : window,
        current,
      };
    } catch (error) {
      this.logger.error(
        `Fixed rate limit check failed for ${identifier}:`,
        error,
      );
      return {
        allowed: true,
        remaining: limit,
        limit,
        resetIn: window,
        current: 0,
      };
    }
  }

  /**
   * Token bucket rate limiting (allows bursts)
   */
  async checkLimitTokenBucket(
    identifier: string,
    config: RateLimitConfig & { burstLimit?: number },
  ): Promise<RateLimitResult> {
    const {
      limit,
      window,
      prefix = DEFAULT_PREFIX,
      burstLimit = limit,
    } = config;
    const key = `${prefix}:bucket:${identifier}`;

    try {
      const now = Date.now();
      const refillRate = limit / window; // tokens per second

      // Get current bucket state
      const bucketData = await this.cache.get<{
        tokens: number;
        lastRefill: number;
      }>(key);

      let tokens: number;
      let lastRefill: number;

      if (bucketData) {
        // Calculate tokens to add based on time elapsed
        const elapsed = (now - bucketData.lastRefill) / 1000;
        const tokensToAdd = elapsed * refillRate;
        tokens = Math.min(burstLimit, bucketData.tokens + tokensToAdd);
        lastRefill = now;
      } else {
        // Initialize bucket
        tokens = burstLimit;
        lastRefill = now;
      }

      const allowed = tokens >= 1;
      if (allowed) {
        tokens -= 1;
      }

      // Store updated bucket state
      await this.cache.set(key, { tokens, lastRefill }, { ttl: window * 2 });

      return {
        allowed,
        remaining: Math.floor(tokens),
        limit: burstLimit,
        resetIn: allowed ? 0 : Math.ceil(1 / refillRate),
        current: burstLimit - Math.floor(tokens),
      };
    } catch (error) {
      this.logger.error(`Token bucket check failed for ${identifier}:`, error);
      return {
        allowed: true,
        remaining: limit,
        limit,
        resetIn: 0,
        current: 0,
      };
    }
  }

  /**
   * Reset rate limit for a specific identifier
   */
  async resetLimit(
    identifier: string,
    prefix: string = DEFAULT_PREFIX,
  ): Promise<void> {
    const pattern = `${prefix}:${identifier}*`;
    await this.cache.deletePattern(pattern);
    this.logger.debug(`Rate limit reset for ${identifier}`);
  }

  /**
   * Get current rate limit status without consuming a request
   */
  async getStatus(
    identifier: string,
    config: RateLimitConfig,
  ): Promise<RateLimitResult> {
    const { limit, window, prefix = DEFAULT_PREFIX } = config;
    const key = `${prefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - window * 1000;

    try {
      const client = this.cache.getClient();

      // Remove old entries and count
      await client.zremrangebyscore(key, 0, windowStart);
      const currentCount = await client.zcard(key);

      const remaining = Math.max(0, limit - currentCount);
      const ttl = await this.cache.ttl(key);

      return {
        allowed: currentCount < limit,
        remaining,
        limit,
        resetIn: ttl > 0 ? ttl : window,
        current: currentCount,
      };
    } catch (error) {
      this.logger.error(
        `Rate limit status check failed for ${identifier}:`,
        error,
      );
      return {
        allowed: true,
        remaining: limit,
        limit,
        resetIn: window,
        current: 0,
      };
    }
  }
}
