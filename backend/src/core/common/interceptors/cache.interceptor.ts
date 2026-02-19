// ============================================================================
// CACHE INTERCEPTOR - Response Caching
// ============================================================================
// Caches GET request responses based on cache key decorators
// ============================================================================

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Optional,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import {
  CACHE_KEY_METADATA,
  CACHE_TTL_METADATA,
} from '../decorators/cache-key.decorator';

// Simple in-memory cache (replace with Redis in production)
interface CacheEntry {
  data: any;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry>();

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    @Optional() @Inject('REDIS_CLIENT') private readonly redisClient?: any,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Get cache metadata
    const cacheKey = this.reflector.get<string>(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );

    if (!cacheKey) {
      return next.handle();
    }

    const ttl =
      this.reflector.get<number>(CACHE_TTL_METADATA, context.getHandler()) ||
      60; // Default 60 seconds

    // Build full cache key with request params
    const fullCacheKey = this.buildCacheKey(cacheKey, request);

    // Try to get from cache
    const cachedData = await this.getFromCache(fullCacheKey);
    if (cachedData !== null) {
      this.logger.debug(`Cache hit: ${fullCacheKey}`);
      return of(cachedData);
    }

    this.logger.debug(`Cache miss: ${fullCacheKey}`);

    // Execute handler and cache result
    return next.handle().pipe(
      tap(async (data) => {
        await this.setInCache(fullCacheKey, data, ttl);
      }),
    );
  }

  private buildCacheKey(baseKey: string, request: any): string {
    const params = new URLSearchParams(request.query).toString();
    const userId = request.user?.id || 'anonymous';
    return `${baseKey}:${userId}:${request.url}${params ? `?${params}` : ''}`;
  }

  private async getFromCache(key: string): Promise<any | null> {
    if (this.redisClient) {
      try {
        const data = await this.redisClient.get(key);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        this.logger.warn(`Redis get error: ${error}`);
        return null;
      }
    }

    // Fallback to memory cache
    const entry = memoryCache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data;
    }
    memoryCache.delete(key);
    return null;
  }

  private async setInCache(key: string, data: any, ttl: number): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.setex(key, ttl, JSON.stringify(data));
      } catch (error) {
        this.logger.warn(`Redis set error: ${error}`);
      }
      return;
    }

    // Fallback to memory cache
    memoryCache.set(key, {
      data,
      expiresAt: Date.now() + ttl * 1000,
    });
  }
}

// Cache invalidation helper
export async function invalidateCache(
  pattern: string,
  redisClient?: any,
): Promise<void> {
  if (redisClient) {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
    return;
  }

  // Memory cache invalidation
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern.replace('*', ''))) {
      memoryCache.delete(key);
    }
  }
}
