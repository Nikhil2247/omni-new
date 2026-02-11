// ============================================================================
// WRITE-THROUGH STRATEGY
// ============================================================================
// Writes go to both cache and data source simultaneously
// Ensures cache is always consistent with data source
// Best for: Write-heavy workloads requiring strong consistency
// ============================================================================

import { Injectable, Logger } from '@nestjs/common'
import { DragonflyService, CacheOptions } from '../dragonfly.service'

export type DataWriter<T> = (key: string, data: T) => Promise<void>
export type DataDeleter = (key: string) => Promise<void>
export type BulkDataWriter<T> = (entries: Array<{ key: string; data: T }>) => Promise<void>

export interface WriteThroughOptions extends CacheOptions {
  writeToSourceFirst?: boolean // Write to source before cache (default: true)
  rollbackOnCacheFailure?: boolean // Rollback source write if cache fails
}

@Injectable()
export class WriteThroughStrategy {
  private readonly logger = new Logger(WriteThroughStrategy.name)
  private readonly writerRegistry = new Map<string, DataWriter<unknown>>()
  private readonly deleterRegistry = new Map<string, DataDeleter>()
  private readonly bulkWriterRegistry = new Map<string, BulkDataWriter<unknown>>()

  constructor(private readonly cache: DragonflyService) {}

  /**
   * Register a data writer for a specific cache namespace
   * @param namespace Namespace identifier
   * @param writer Function to write data to source
   */
  registerWriter<T>(namespace: string, writer: DataWriter<T>): void {
    this.writerRegistry.set(namespace, writer as DataWriter<unknown>)
    this.logger.log(`Registered write-through writer for namespace: ${namespace}`)
  }

  /**
   * Register a data deleter for a specific cache namespace
   * @param namespace Namespace identifier
   * @param deleter Function to delete data from source
   */
  registerDeleter(namespace: string, deleter: DataDeleter): void {
    this.deleterRegistry.set(namespace, deleter)
    this.logger.log(`Registered write-through deleter for namespace: ${namespace}`)
  }

  /**
   * Register a bulk data writer for a specific cache namespace
   * @param namespace Namespace identifier
   * @param writer Function to write multiple items to source
   */
  registerBulkWriter<T>(namespace: string, writer: BulkDataWriter<T>): void {
    this.bulkWriterRegistry.set(namespace, writer as BulkDataWriter<unknown>)
    this.logger.log(`Registered bulk write-through writer for namespace: ${namespace}`)
  }

  /**
   * Write data to both cache and source
   * @param namespace Cache namespace
   * @param id Unique identifier
   * @param data Data to write
   * @param options Write options
   */
  async write<T>(namespace: string, id: string, data: T, options?: WriteThroughOptions): Promise<void> {
    const key = this.buildKey(namespace, id)
    const writeToSourceFirst = options?.writeToSourceFirst !== false

    const writer = this.writerRegistry.get(namespace) as DataWriter<T> | undefined

    if (!writer) {
      throw new Error(`No write-through writer registered for namespace: ${namespace}`)
    }

    if (writeToSourceFirst) {
      // Write to source first
      await writer(id, data)
      this.logger.debug(`Write-through: Written to source: ${key}`)

      // Then write to cache
      const cacheSuccess = await this.cache.set(key, data, options)

      if (!cacheSuccess) {
        this.logger.error(`Write-through: Cache write failed for ${key}`)

        if (options?.rollbackOnCacheFailure) {
          // Rollback not typically implemented for write-through
          // as source is considered authoritative
          this.logger.warn(`Rollback requested but not supported for write-through`)
        }
      }

      this.logger.debug(`Write-through: Written to cache: ${key}`)
    } else {
      // Write to cache first (less common)
      const cacheSuccess = await this.cache.set(key, data, options)

      if (!cacheSuccess) {
        throw new Error(`Write-through: Cache write failed for ${key}`)
      }

      try {
        await writer(id, data)
        this.logger.debug(`Write-through complete: ${key}`)
      } catch (error) {
        // Rollback cache on source failure
        await this.cache.delete(key)
        throw error
      }
    }
  }

  /**
   * Write multiple items to both cache and source
   * @param namespace Cache namespace
   * @param entries Array of { id, data } pairs
   * @param options Write options
   */
  async mwrite<T>(
    namespace: string,
    entries: Array<{ id: string; data: T }>,
    options?: WriteThroughOptions,
  ): Promise<void> {
    const bulkWriter = this.bulkWriterRegistry.get(namespace) as BulkDataWriter<T> | undefined

    if (bulkWriter) {
      // Use bulk writer
      const sourceEntries = entries.map(({ id, data }) => ({ key: id, data }))
      await bulkWriter(sourceEntries)

      // Write to cache
      const cacheEntries = entries.map(({ id, data }) => ({
        key: this.buildKey(namespace, id),
        value: data,
      }))

      await this.cache.mset(cacheEntries, options)
      this.logger.debug(`Write-through bulk: ${entries.length} items to ${namespace}`)
    } else {
      // Fallback to individual writes
      for (const entry of entries) {
        await this.write(namespace, entry.id, entry.data, options)
      }
    }
  }

  /**
   * Write data with custom writer (without pre-registration)
   * @param key Cache key
   * @param data Data to write
   * @param writer Custom writer function
   * @param options Write options
   */
  async writeWithWriter<T>(
    key: string,
    data: T,
    writer: () => Promise<void>,
    options?: WriteThroughOptions,
  ): Promise<void> {
    const writeToSourceFirst = options?.writeToSourceFirst !== false

    if (writeToSourceFirst) {
      await writer()
      await this.cache.set(key, data, options)
    } else {
      await this.cache.set(key, data, options)

      try {
        await writer()
      } catch (error) {
        await this.cache.delete(key)
        throw error
      }
    }

    this.logger.debug(`Write-through complete: ${key}`)
  }

  /**
   * Delete data from both cache and source
   * @param namespace Cache namespace
   * @param id Unique identifier
   * @param options Cache options
   */
  async delete(namespace: string, id: string, options?: WriteThroughOptions): Promise<void> {
    const key = this.buildKey(namespace, id)

    const deleter = this.deleterRegistry.get(namespace)

    if (!deleter) {
      throw new Error(`No write-through deleter registered for namespace: ${namespace}`)
    }

    const deleteFromSourceFirst = options?.writeToSourceFirst !== false

    if (deleteFromSourceFirst) {
      // Delete from source first
      await deleter(id)
      this.logger.debug(`Write-through: Deleted from source: ${key}`)

      // Then delete from cache
      await this.cache.delete(key, options)
      this.logger.debug(`Write-through: Deleted from cache: ${key}`)
    } else {
      // Delete from cache first
      await this.cache.delete(key, options)

      try {
        await deleter(id)
      } catch (error) {
        this.logger.error(`Write-through: Source delete failed, cache already invalidated: ${key}`)
        throw error
      }
    }
  }

  /**
   * Delete with custom deleter
   * @param key Cache key
   * @param deleter Custom deleter function
   */
  async deleteWithDeleter(key: string, deleter: () => Promise<void>): Promise<void> {
    await deleter()
    await this.cache.delete(key)
    this.logger.debug(`Write-through delete complete: ${key}`)
  }

  /**
   * Update data atomically (read-modify-write)
   * @param namespace Cache namespace
   * @param id Unique identifier
   * @param updater Function that receives current data and returns updated data
   * @param fetcher Function to fetch current data if not in cache
   * @param options Write options
   */
  async update<T>(
    namespace: string,
    id: string,
    updater: (current: T | null) => T,
    fetcher: () => Promise<T | null>,
    options?: WriteThroughOptions,
  ): Promise<T> {
    const key = this.buildKey(namespace, id)

    // Get current value
    let current = await this.cache.get<T>(key, options)

    if (current === null) {
      current = await fetcher()
    }

    // Apply update
    const updated = updater(current)

    // Write back
    await this.write(namespace, id, updated, options)

    return updated
  }

  /**
   * Increment a numeric value
   * @param namespace Cache namespace
   * @param id Unique identifier
   * @param increment Amount to increment (default: 1)
   * @param writer Custom writer to persist the new value
   */
  async increment(
    namespace: string,
    id: string,
    increment: number = 1,
    writer: (newValue: number) => Promise<void>,
  ): Promise<number> {
    const key = this.buildKey(namespace, id)

    // Increment in cache
    const newValue = await this.cache.incrby(key, increment)

    // Persist to source
    await writer(newValue)

    this.logger.debug(`Write-through increment: ${key} = ${newValue}`)

    return newValue
  }

  /**
   * Check if a writer is registered for a namespace
   */
  hasWriter(namespace: string): boolean {
    return this.writerRegistry.has(namespace)
  }

  /**
   * Get all registered namespaces
   */
  getRegisteredNamespaces(): string[] {
    return Array.from(new Set([...this.writerRegistry.keys(), ...this.deleterRegistry.keys()]))
  }

  private buildKey(namespace: string, id: string): string {
    return `${namespace}:${id}`
  }
}
