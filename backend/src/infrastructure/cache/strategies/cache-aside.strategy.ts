// ============================================================================
// CACHE-ASIDE STRATEGY (Lazy Loading)
// ============================================================================
// Application manages cache: read from cache first, if miss, fetch from source
// and update cache. On write, invalidate cache entry.
// Best for: Read-heavy workloads with tolerance for eventual consistency
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { DragonflyService, CacheOptions } from '../dragonfly.service';

export interface CacheAsideOptions extends CacheOptions {
  refreshOnExpire?: boolean;
  staleWhileRevalidate?: number; // Serve stale data while fetching fresh
}

@Injectable()
export class CacheAsideStrategy {
  private readonly logger = new Logger(CacheAsideStrategy.name);

  constructor(private readonly cache: DragonflyService) {}

  /**
   * Get data from cache or fetch from source if cache miss
   * @param key Cache key
   * @param fetcher Function to fetch data from source
   * @param options Cache options
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheAsideOptions,
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.cache.get<T>(key, options);

    if (cached !== null) {
      this.logger.debug(`Cache HIT for key: ${key}`);

      // Handle stale-while-revalidate pattern
      if (options?.staleWhileRevalidate) {
        const ttlRemaining = await this.cache.ttl(key, options);

        if (ttlRemaining > 0 && ttlRemaining < options.staleWhileRevalidate) {
          // TTL is low, refresh in background
          this.refreshInBackground(key, fetcher, options);
        }
      }

      return cached;
    }

    this.logger.debug(`Cache MISS for key: ${key}`);

    // Fetch from source
    const data = await fetcher();

    // Store in cache
    await this.cache.set(key, data, options);

    return data;
  }

  /**
   * Get multiple items from cache or fetch missing ones from source
   * @param keys Array of cache keys
   * @param fetcher Function to fetch data for given keys
   * @param options Cache options
   */
  async mget<T>(
    keys: string[],
    fetcher: (missingKeys: string[]) => Promise<Map<string, T>>,
    options?: CacheAsideOptions,
  ): Promise<Map<string, T>> {
    const result = new Map<string, T>();

    // Try to get all from cache
    const cached = await this.cache.mget<T>(keys, options);

    const missingKeys: string[] = [];

    keys.forEach((key, index) => {
      if (cached[index] !== null) {
        result.set(key, cached[index] as T);
      } else {
        missingKeys.push(key);
      }
    });

    this.logger.debug(
      `Cache: ${keys.length - missingKeys.length} HITs, ${missingKeys.length} MISSes`,
    );

    // Fetch missing data from source
    if (missingKeys.length > 0) {
      const fetchedData = await fetcher(missingKeys);

      // Store fetched data in cache and result
      const entries: Array<{ key: string; value: T }> = [];

      for (const [key, value] of fetchedData) {
        result.set(key, value);
        entries.push({ key, value });
      }

      if (entries.length > 0) {
        await this.cache.mset(entries, options);
      }
    }

    return result;
  }

  /**
   * Invalidate cache entry (used after data modification)
   * @param key Cache key to invalidate
   * @param options Cache options
   */
  async invalidate(key: string, options?: CacheOptions): Promise<boolean> {
    this.logger.debug(`Invalidating cache key: ${key}`);
    return this.cache.delete(key, options);
  }

  /**
   * Invalidate multiple cache entries
   * @param keys Cache keys to invalidate
   * @param options Cache options
   */
  async invalidateMany(
    keys: string[],
    options?: CacheOptions,
  ): Promise<number> {
    let count = 0;

    for (const key of keys) {
      const deleted = await this.cache.delete(key, options);
      if (deleted) count++;
    }

    this.logger.debug(`Invalidated ${count}/${keys.length} cache keys`);
    return count;
  }

  /**
   * Invalidate cache entries matching a pattern
   * @param pattern Pattern to match (e.g., "user:*")
   * @param options Cache options
   */
  async invalidatePattern(
    pattern: string,
    options?: CacheOptions,
  ): Promise<number> {
    this.logger.debug(`Invalidating cache pattern: ${pattern}`);
    return this.cache.deletePattern(pattern, options);
  }

  /**
   * Update cache entry (used when you want to update cache without invalidating)
   * @param key Cache key
   * @param data New data
   * @param options Cache options
   */
  async update<T>(
    key: string,
    data: T,
    options?: CacheOptions,
  ): Promise<boolean> {
    this.logger.debug(`Updating cache key: ${key}`);
    return this.cache.set(key, data, options);
  }

  /**
   * Get data and refresh in background if stale
   * Uses stale-while-revalidate pattern
   */
  async getWithSWR<T>(
    key: string,
    fetcher: () => Promise<T>,
    staleThreshold: number,
    options?: CacheOptions,
  ): Promise<T | null> {
    const cached = await this.cache.get<T>(key, options);

    if (cached !== null) {
      const ttl = await this.cache.ttl(key, options);

      // If TTL is below threshold, refresh in background
      if (ttl > 0 && ttl < staleThreshold) {
        this.refreshInBackground(key, fetcher, options);
      }

      return cached;
    }

    // No cached data, fetch synchronously
    const data = await fetcher();
    await this.cache.set(key, data, options);

    return data;
  }

  /**
   * Refresh cache entry in background
   */
  private async refreshInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions,
  ): Promise<void> {
    // Don't await - run in background
    setImmediate(async () => {
      try {
        this.logger.debug(`Background refresh for key: ${key}`);
        const data = await fetcher();
        await this.cache.set(key, data, options);
      } catch (error) {
        this.logger.error(`Background refresh failed for key: ${key}`, error);
      }
    });
  }

  /**
   * Get or set with lock to prevent cache stampede
   * Uses a distributed lock to ensure only one process fetches data
   */
  async getOrSetWithLock<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheAsideOptions & { lockTimeout?: number },
  ): Promise<T> {
    const cached = await this.cache.get<T>(key, options);

    if (cached !== null) {
      return cached;
    }

    const lockKey = `lock:${key}`;
    const lockTimeout = options?.lockTimeout ?? 10;

    // Try to acquire lock
    const lockAcquired = await this.cache.set(lockKey, '1', {
      ttl: lockTimeout,
      nx: true,
    });

    if (!lockAcquired) {
      // Another process is fetching, wait and retry
      await this.sleep(100);
      return this.getOrSetWithLock(key, fetcher, options);
    }

    try {
      // Double-check cache after acquiring lock
      const rechecked = await this.cache.get<T>(key, options);
      if (rechecked !== null) {
        return rechecked;
      }

      // Fetch data
      const data = await fetcher();
      await this.cache.set(key, data, options);

      return data;
    } finally {
      // Release lock
      await this.cache.delete(lockKey);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
