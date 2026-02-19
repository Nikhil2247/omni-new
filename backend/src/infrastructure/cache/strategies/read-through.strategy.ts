// ============================================================================
// READ-THROUGH STRATEGY
// ============================================================================
// Cache automatically fetches data from source on cache miss
// Application only interacts with cache layer, not data source directly
// Best for: Simplifying application code, consistent caching behavior
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { DragonflyService, CacheOptions } from '../dragonfly.service';

export type DataFetcher<T> = (key: string) => Promise<T | null>;
export type BulkDataFetcher<T> = (keys: string[]) => Promise<Map<string, T>>;

export interface ReadThroughOptions extends CacheOptions {
  allowNull?: boolean; // Cache null values to prevent repeated lookups
  nullTtl?: number; // TTL for null values (shorter than normal TTL)
}

@Injectable()
export class ReadThroughStrategy {
  private readonly logger = new Logger(ReadThroughStrategy.name);
  private readonly fetcherRegistry = new Map<string, DataFetcher<unknown>>();
  private readonly bulkFetcherRegistry = new Map<
    string,
    BulkDataFetcher<unknown>
  >();

  constructor(private readonly cache: DragonflyService) {}

  /**
   * Register a data fetcher for a specific cache namespace
   * @param namespace Namespace identifier (e.g., "user", "event")
   * @param fetcher Function to fetch data from source
   */
  registerFetcher<T>(namespace: string, fetcher: DataFetcher<T>): void {
    this.fetcherRegistry.set(namespace, fetcher as DataFetcher<unknown>);
    this.logger.log(
      `Registered read-through fetcher for namespace: ${namespace}`,
    );
  }

  /**
   * Register a bulk data fetcher for a specific cache namespace
   * @param namespace Namespace identifier
   * @param fetcher Function to fetch multiple items from source
   */
  registerBulkFetcher<T>(namespace: string, fetcher: BulkDataFetcher<T>): void {
    this.bulkFetcherRegistry.set(
      namespace,
      fetcher as BulkDataFetcher<unknown>,
    );
    this.logger.log(
      `Registered bulk read-through fetcher for namespace: ${namespace}`,
    );
  }

  /**
   * Get data using read-through pattern
   * @param namespace Cache namespace
   * @param id Unique identifier within namespace
   * @param options Cache options
   */
  async get<T>(
    namespace: string,
    id: string,
    options?: ReadThroughOptions,
  ): Promise<T | null> {
    const key = this.buildKey(namespace, id);

    // Try cache first
    const cached = await this.cache.get<T | null>(key, options);

    if (cached !== null) {
      this.logger.debug(`Read-through HIT: ${key}`);
      return cached;
    }

    // Check for cached null marker
    const nullMarker = await this.cache.get<string>(`${key}:null`, options);
    if (nullMarker !== null) {
      this.logger.debug(`Read-through NULL marker: ${key}`);
      return null;
    }

    this.logger.debug(`Read-through MISS: ${key}`);

    // Get fetcher for namespace
    const fetcher = this.fetcherRegistry.get(namespace) as
      | DataFetcher<T>
      | undefined;

    if (!fetcher) {
      this.logger.error(`No fetcher registered for namespace: ${namespace}`);
      throw new Error(
        `No read-through fetcher registered for namespace: ${namespace}`,
      );
    }

    // Fetch from source
    const data = await fetcher(id);

    if (data === null) {
      // Cache null result to prevent repeated lookups
      if (options?.allowNull) {
        await this.cache.set(`${key}:null`, 'true', {
          ttl: options.nullTtl ?? 60, // Default 1 minute for null values
        });
      }
      return null;
    }

    // Store in cache
    await this.cache.set(key, data, options);

    return data;
  }

  /**
   * Get multiple items using read-through pattern
   * @param namespace Cache namespace
   * @param ids Array of identifiers
   * @param options Cache options
   */
  async mget<T>(
    namespace: string,
    ids: string[],
    options?: ReadThroughOptions,
  ): Promise<Map<string, T>> {
    const result = new Map<string, T>();
    const keys = ids.map((id) => this.buildKey(namespace, id));

    // Try cache first
    const cached = await this.cache.mget<T>(keys, options);

    const missingIds: string[] = [];

    ids.forEach((id, index) => {
      if (cached[index] !== null) {
        result.set(id, cached[index] as T);
      } else {
        missingIds.push(id);
      }
    });

    this.logger.debug(
      `Read-through: ${ids.length - missingIds.length} HITs, ${missingIds.length} MISSes`,
    );

    if (missingIds.length === 0) {
      return result;
    }

    // Get bulk fetcher for namespace
    const bulkFetcher = this.bulkFetcherRegistry.get(namespace) as
      | BulkDataFetcher<T>
      | undefined;

    if (bulkFetcher) {
      // Use bulk fetcher
      const fetchedData = await bulkFetcher(missingIds);
      const entries: Array<{ key: string; value: T }> = [];

      for (const [id, data] of fetchedData) {
        result.set(id, data);
        entries.push({ key: this.buildKey(namespace, id), value: data });
      }

      if (entries.length > 0) {
        await this.cache.mset(entries, options);
      }
    } else {
      // Fallback to individual fetcher
      const fetcher = this.fetcherRegistry.get(namespace) as
        | DataFetcher<T>
        | undefined;

      if (!fetcher) {
        throw new Error(
          `No read-through fetcher registered for namespace: ${namespace}`,
        );
      }

      const entries: Array<{ key: string; value: T }> = [];

      for (const id of missingIds) {
        const data = await fetcher(id);

        if (data !== null) {
          result.set(id, data);
          entries.push({ key: this.buildKey(namespace, id), value: data });
        }
      }

      if (entries.length > 0) {
        await this.cache.mset(entries, options);
      }
    }

    return result;
  }

  /**
   * Get data with custom fetcher (without pre-registration)
   * @param key Cache key
   * @param fetcher Data fetcher function
   * @param options Cache options
   */
  async getWithFetcher<T>(
    key: string,
    fetcher: () => Promise<T | null>,
    options?: ReadThroughOptions,
  ): Promise<T | null> {
    // Try cache first
    const cached = await this.cache.get<T>(key, options);

    if (cached !== null) {
      this.logger.debug(`Read-through HIT: ${key}`);
      return cached;
    }

    this.logger.debug(`Read-through MISS: ${key}`);

    // Fetch from source
    const data = await fetcher();

    if (data === null) {
      if (options?.allowNull) {
        await this.cache.set(`${key}:null`, 'true', {
          ttl: options.nullTtl ?? 60,
        });
      }
      return null;
    }

    // Store in cache
    await this.cache.set(key, data, options);

    return data;
  }

  /**
   * Invalidate cached data for a specific item
   * @param namespace Cache namespace
   * @param id Item identifier
   */
  async invalidate(namespace: string, id: string): Promise<boolean> {
    const key = this.buildKey(namespace, id);
    await this.cache.delete(`${key}:null`); // Also delete null marker
    return this.cache.delete(key);
  }

  /**
   * Invalidate all cached data for a namespace
   * @param namespace Cache namespace
   */
  async invalidateNamespace(namespace: string): Promise<number> {
    return this.cache.deletePattern(`${namespace}:*`);
  }

  /**
   * Warm up cache by pre-fetching data
   * @param namespace Cache namespace
   * @param ids Array of identifiers to pre-fetch
   * @param options Cache options
   */
  async warmUp<T>(
    namespace: string,
    ids: string[],
    options?: CacheOptions,
  ): Promise<void> {
    this.logger.log(`Warming up cache for ${namespace}: ${ids.length} items`);

    const bulkFetcher = this.bulkFetcherRegistry.get(namespace) as
      | BulkDataFetcher<T>
      | undefined;

    if (bulkFetcher) {
      const data = await bulkFetcher(ids);
      const entries: Array<{ key: string; value: T }> = [];

      for (const [id, value] of data) {
        entries.push({ key: this.buildKey(namespace, id), value });
      }

      await this.cache.mset(entries, options);
      this.logger.log(
        `Warmed up ${entries.length} items for namespace: ${namespace}`,
      );
    } else {
      const fetcher = this.fetcherRegistry.get(namespace) as
        | DataFetcher<T>
        | undefined;

      if (!fetcher) {
        throw new Error(`No fetcher registered for namespace: ${namespace}`);
      }

      let count = 0;

      for (const id of ids) {
        const data = await fetcher(id);

        if (data !== null) {
          await this.cache.set(this.buildKey(namespace, id), data, options);
          count++;
        }
      }

      this.logger.log(`Warmed up ${count} items for namespace: ${namespace}`);
    }
  }

  /**
   * Check if a fetcher is registered for a namespace
   */
  hasFetcher(namespace: string): boolean {
    return this.fetcherRegistry.has(namespace);
  }

  /**
   * Get all registered namespaces
   */
  getRegisteredNamespaces(): string[] {
    return Array.from(this.fetcherRegistry.keys());
  }

  private buildKey(namespace: string, id: string): string {
    return `${namespace}:${id}`;
  }
}
