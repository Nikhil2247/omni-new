// ============================================================================
// DRAGONFLY SERVICE - Redis-Compatible Cache Service
// ============================================================================
// High-performance cache service using Dragonfly (Redis-compatible)
// Supports JSON serialization, TTL, and connection pooling
// ============================================================================

import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { Redis as RedisClient } from 'ioredis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix for namespacing
}

export interface CacheSetOptions extends CacheOptions {
  nx?: boolean; // Only set if key doesn't exist
  xx?: boolean; // Only set if key exists
}

@Injectable()
export class DragonflyService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DragonflyService.name);
  private client: RedisClient;
  private subscriber: RedisClient;
  private readonly defaultTtl: number;
  private readonly keyPrefix: string;

  constructor(private readonly configService: ConfigService) {
    this.defaultTtl = this.configService.get<number>('CACHE_DEFAULT_TTL', 3600);
    this.keyPrefix = this.configService.get<string>(
      'CACHE_KEY_PREFIX',
      'omni:',
    );
  }

  async onModuleInit(): Promise<void> {
    const host = this.configService.get<string>('DRAGONFLY_HOST', 'localhost');
    const port = this.configService.get<number>('DRAGONFLY_PORT', 6379);
    const password = this.configService.get<string>('DRAGONFLY_PASSWORD');
    const db = this.configService.get<number>('DRAGONFLY_DB', 0);
    const connectTimeout = this.configService.get<number>(
      'DRAGONFLY_CONNECT_TIMEOUT',
      15000,
    );
    const maxRetriesPerRequest = this.configService.get<number>(
      'DRAGONFLY_MAX_RETRIES',
      10,
    );
    const retryDelayMs = this.configService.get<number>(
      'DRAGONFLY_RETRY_DELAY_MS',
      500,
    );
    const retryDelayMaxMs = this.configService.get<number>(
      'DRAGONFLY_RETRY_DELAY_MAX_MS',
      5000,
    );

    const connectionOptions = {
      host,
      port,
      password: password || undefined,
      db,
      maxRetriesPerRequest,
      retryDelayOnFailover: 100,
      connectTimeout,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy: (times: number) =>
        Math.min(times * retryDelayMs, retryDelayMaxMs),
    };

    this.client = new Redis(connectionOptions);
    this.subscriber = new Redis(connectionOptions);

    this.setupEventListeners();

    try {
      await this.client.connect();
      await this.subscriber.connect();
      this.logger.log(`Connected to Dragonfly at ${host}:${port}`);
    } catch (error) {
      this.logger.error('Failed to connect to Dragonfly', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting from Dragonfly...');

    await Promise.all([
      this.shutdownClient(this.subscriber, 'subscriber'),
      this.shutdownClient(this.client, 'client'),
    ]);

    this.logger.log('Disconnected from Dragonfly');
  }

  private async shutdownClient(
    client: RedisClient | undefined,
    label: string,
  ): Promise<void> {
    if (!client) return;

    const quitTimeoutMs = this.configService.get<number>(
      'DRAGONFLY_SHUTDOWN_TIMEOUT_MS',
      2000,
    );

    try {
      await Promise.race([
        client.quit(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`${label} quit timeout`)),
            quitTimeoutMs,
          ),
        ),
      ]);
      this.logger.log(`Dragonfly ${label} connection closed`);
    } catch (error) {
      this.logger.warn(
        `Dragonfly ${label} graceful quit failed, forcing disconnect`,
      );
      client.disconnect();
      this.logger.debug(
        `Dragonfly ${label} disconnect fallback used: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  private setupEventListeners(): void {
    this.client.on('error', (err) => {
      this.logger.error('Dragonfly client error', err);
    });

    this.client.on('reconnecting', () => {
      this.logger.warn('Dragonfly client reconnecting...');
    });

    this.client.on('ready', () => {
      this.logger.log('Dragonfly client ready');
    });
  }

  // ============================================================================
  // BASIC OPERATIONS
  // ============================================================================

  private buildKey(key: string, prefix?: string): string {
    return `${prefix || this.keyPrefix}${key}`;
  }

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const value = await this.client.get(fullKey);

      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Cache get error for key: ${key}`, error);
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    options?: CacheSetOptions,
  ): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const serialized = JSON.stringify(value);
      const ttl = options?.ttl ?? this.defaultTtl;

      if (options?.nx) {
        const result = await this.client.set(
          fullKey,
          serialized,
          'EX',
          ttl,
          'NX',
        );
        return result === 'OK';
      }

      if (options?.xx) {
        const result = await this.client.set(
          fullKey,
          serialized,
          'EX',
          ttl,
          'XX',
        );
        return result === 'OK';
      }

      await this.client.set(fullKey, serialized, 'EX', ttl);
      return true;
    } catch (error) {
      this.logger.error(`Cache set error for key: ${key}`, error);
      return false;
    }
  }

  async delete(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const result = await this.client.del(fullKey);
      return result > 0;
    } catch (error) {
      this.logger.error(`Cache delete error for key: ${key}`, error);
      return false;
    }
  }

  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const result = await this.client.exists(fullKey);
      return result > 0;
    } catch (error) {
      this.logger.error(`Cache exists error for key: ${key}`, error);
      return false;
    }
  }

  async expire(
    key: string,
    ttl: number,
    options?: CacheOptions,
  ): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const result = await this.client.expire(fullKey, ttl);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache expire error for key: ${key}`, error);
      return false;
    }
  }

  async ttl(key: string, options?: CacheOptions): Promise<number> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      return await this.client.ttl(fullKey);
    } catch (error) {
      this.logger.error(`Cache TTL error for key: ${key}`, error);
      return -2; // Key doesn't exist
    }
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  async mget<T>(keys: string[], options?: CacheOptions): Promise<(T | null)[]> {
    try {
      const fullKeys = keys.map((k) => this.buildKey(k, options?.prefix));
      const values = await this.client.mget(...fullKeys);

      return values.map((v) => (v ? (JSON.parse(v) as T) : null));
    } catch (error) {
      this.logger.error('Cache mget error', error);
      return keys.map(() => null);
    }
  }

  async mset<T>(
    entries: Array<{ key: string; value: T }>,
    options?: CacheSetOptions,
  ): Promise<boolean> {
    try {
      const pipeline = this.client.pipeline();
      const ttl = options?.ttl ?? this.defaultTtl;

      for (const entry of entries) {
        const fullKey = this.buildKey(entry.key, options?.prefix);
        const serialized = JSON.stringify(entry.value);
        pipeline.set(fullKey, serialized, 'EX', ttl);
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      this.logger.error('Cache mset error', error);
      return false;
    }
  }

  async deletePattern(
    pattern: string,
    options?: CacheOptions,
  ): Promise<number> {
    try {
      const fullPattern = this.buildKey(pattern, options?.prefix);
      const keys = await this.client.keys(fullPattern);

      if (keys.length === 0) return 0;

      const result = await this.client.del(...keys);
      return result;
    } catch (error) {
      this.logger.error(
        `Cache deletePattern error for pattern: ${pattern}`,
        error,
      );
      return 0;
    }
  }

  // ============================================================================
  // HASH OPERATIONS
  // ============================================================================

  async hget<T>(
    key: string,
    field: string,
    options?: CacheOptions,
  ): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const value = await this.client.hget(fullKey, field);

      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(
        `Cache hget error for key: ${key}, field: ${field}`,
        error,
      );
      return null;
    }
  }

  async hset<T>(
    key: string,
    field: string,
    value: T,
    options?: CacheOptions,
  ): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const serialized = JSON.stringify(value);
      await this.client.hset(fullKey, field, serialized);

      if (options?.ttl) {
        await this.client.expire(fullKey, options.ttl);
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Cache hset error for key: ${key}, field: ${field}`,
        error,
      );
      return false;
    }
  }

  async hgetall<T>(
    key: string,
    options?: CacheOptions,
  ): Promise<Record<string, T> | null> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const values = await this.client.hgetall(fullKey);

      if (!values || Object.keys(values).length === 0) return null;

      const result: Record<string, T> = {};
      for (const [field, value] of Object.entries(values)) {
        result[field] = JSON.parse(value) as T;
      }

      return result;
    } catch (error) {
      this.logger.error(`Cache hgetall error for key: ${key}`, error);
      return null;
    }
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    try {
      const fullKey = this.buildKey(key);
      return await this.client.hdel(fullKey, ...fields);
    } catch (error) {
      this.logger.error(`Cache hdel error for key: ${key}`, error);
      return 0;
    }
  }

  // ============================================================================
  // LIST OPERATIONS
  // ============================================================================

  async lpush<T>(key: string, ...values: T[]): Promise<number> {
    try {
      const fullKey = this.buildKey(key);
      const serialized = values.map((v) => JSON.stringify(v));
      return await this.client.lpush(fullKey, ...serialized);
    } catch (error) {
      this.logger.error(`Cache lpush error for key: ${key}`, error);
      return 0;
    }
  }

  async rpush<T>(key: string, ...values: T[]): Promise<number> {
    try {
      const fullKey = this.buildKey(key);
      const serialized = values.map((v) => JSON.stringify(v));
      return await this.client.rpush(fullKey, ...serialized);
    } catch (error) {
      this.logger.error(`Cache rpush error for key: ${key}`, error);
      return 0;
    }
  }

  async lrange<T>(
    key: string,
    start: number,
    stop: number,
    options?: CacheOptions,
  ): Promise<T[]> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const values = await this.client.lrange(fullKey, start, stop);

      return values.map((v) => JSON.parse(v) as T);
    } catch (error) {
      this.logger.error(`Cache lrange error for key: ${key}`, error);
      return [];
    }
  }

  // ============================================================================
  // SET OPERATIONS
  // ============================================================================

  async sadd<T>(key: string, ...members: T[]): Promise<number> {
    try {
      const fullKey = this.buildKey(key);
      const serialized = members.map((m) => JSON.stringify(m));
      return await this.client.sadd(fullKey, ...serialized);
    } catch (error) {
      this.logger.error(`Cache sadd error for key: ${key}`, error);
      return 0;
    }
  }

  async smembers<T>(key: string, options?: CacheOptions): Promise<T[]> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const values = await this.client.smembers(fullKey);

      return values.map((v) => JSON.parse(v) as T);
    } catch (error) {
      this.logger.error(`Cache smembers error for key: ${key}`, error);
      return [];
    }
  }

  async sismember<T>(
    key: string,
    member: T,
    options?: CacheOptions,
  ): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      const serialized = JSON.stringify(member);
      const result = await this.client.sismember(fullKey, serialized);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache sismember error for key: ${key}`, error);
      return false;
    }
  }

  // ============================================================================
  // SORTED SET OPERATIONS
  // ============================================================================

  async zadd(
    key: string,
    score: number,
    member: string,
    options?: CacheOptions,
  ): Promise<number> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      return await this.client.zadd(fullKey, score, member);
    } catch (error) {
      this.logger.error(`Cache zadd error for key: ${key}`, error);
      return 0;
    }
  }

  async zrange(
    key: string,
    start: number,
    stop: number,
    options?: CacheOptions,
  ): Promise<string[]> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      return await this.client.zrange(fullKey, start, stop);
    } catch (error) {
      this.logger.error(`Cache zrange error for key: ${key}`, error);
      return [];
    }
  }

  async zrangebyscore(
    key: string,
    min: number | string,
    max: number | string,
    options?: CacheOptions,
  ): Promise<string[]> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      return await this.client.zrangebyscore(fullKey, min, max);
    } catch (error) {
      this.logger.error(`Cache zrangebyscore error for key: ${key}`, error);
      return [];
    }
  }

  // ============================================================================
  // ATOMIC OPERATIONS
  // ============================================================================

  async incr(key: string, options?: CacheOptions): Promise<number> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      return await this.client.incr(fullKey);
    } catch (error) {
      this.logger.error(`Cache incr error for key: ${key}`, error);
      return 0;
    }
  }

  async incrby(
    key: string,
    increment: number,
    options?: CacheOptions,
  ): Promise<number> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      return await this.client.incrby(fullKey, increment);
    } catch (error) {
      this.logger.error(`Cache incrby error for key: ${key}`, error);
      return 0;
    }
  }

  async decr(key: string, options?: CacheOptions): Promise<number> {
    try {
      const fullKey = this.buildKey(key, options?.prefix);
      return await this.client.decr(fullKey);
    } catch (error) {
      this.logger.error(`Cache decr error for key: ${key}`, error);
      return 0;
    }
  }

  // ============================================================================
  // PUB/SUB OPERATIONS
  // ============================================================================

  async publish(channel: string, message: unknown): Promise<number> {
    try {
      const serialized = JSON.stringify(message);
      return await this.client.publish(channel, serialized);
    } catch (error) {
      this.logger.error(`Cache publish error for channel: ${channel}`, error);
      return 0;
    }
  }

  async subscribe(
    channel: string,
    callback: (message: unknown) => void,
  ): Promise<void> {
    try {
      await this.subscriber.subscribe(channel);

      this.subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          try {
            const parsed = JSON.parse(message);
            callback(parsed);
          } catch {
            callback(message);
          }
        }
      });
    } catch (error) {
      this.logger.error(`Cache subscribe error for channel: ${channel}`, error);
    }
  }

  async unsubscribe(channel: string): Promise<void> {
    try {
      await this.subscriber.unsubscribe(channel);
    } catch (error) {
      this.logger.error(
        `Cache unsubscribe error for channel: ${channel}`,
        error,
      );
    }
  }

  // ============================================================================
  // UTILITY OPERATIONS
  // ============================================================================

  async flush(): Promise<void> {
    if (this.configService.get('NODE_ENV') === 'production') {
      throw new Error('flush() cannot be used in production environment');
    }

    await this.client.flushdb();
    this.logger.warn('Cache database flushed');
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  async info(): Promise<string> {
    return await this.client.info();
  }

  getClient(): RedisClient {
    return this.client;
  }
}
