import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { METRICS_QUEUE } from '../../../infrastructure/jobs/processors/metrics-aggregation.processor';
import { PrismaService } from '../../../core/database/prisma.service';
import { DragonflyService } from '../../../infrastructure/cache/dragonfly.service';
import { MeilisearchService } from '../../../infrastructure/search/meilisearch.service';
import { MinioService } from '../../../infrastructure/storage/minio.service';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'not_configured';
  latencyMs?: number;
  error?: string;
  details?: Record<string, unknown>;
}

@Injectable()
export class SystemHealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly cache: DragonflyService,
    private readonly search: MeilisearchService,
    private readonly storage: MinioService,
  ) {}

  async getHealth() {
    const connectionDetails = this.getConnectionDetails();

    const [database, cache, queue, search, storage] = await Promise.all([
      this.checkDatabase(),
      this.checkCache(connectionDetails.redis),
      this.checkQueue(connectionDetails.queue),
      this.checkSearch(connectionDetails.search),
      this.checkStorage(connectionDetails.storage),
    ]);

    const memory = process.memoryUsage();
    const overallStatus = [database, cache, queue, search, storage].some(
      (check) => check.status === 'degraded',
    )
      ? 'degraded'
      : 'healthy';

    return {
      status: overallStatus,
      checks: {
        database,
        cache,
        queue,
        search,
        storage,
      },
      connections: connectionDetails,
      resources: {
        uptimeSeconds: Math.round(process.uptime()),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV ?? 'development',
        platform: process.platform,
        pid: process.pid,
        memory: {
          rss: memory.rss,
          heapTotal: memory.heapTotal,
          heapUsed: memory.heapUsed,
          external: memory.external,
          arrayBuffers: memory.arrayBuffers,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<HealthCheckResult> {
    const startedAt = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', latencyMs: Date.now() - startedAt };
    } catch (error) {
      return {
        status: 'degraded',
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'Database check failed',
      };
    }
  }

  private async checkCache(details: {
    host: string;
    port: number;
    db: number;
  }): Promise<HealthCheckResult> {
    const startedAt = Date.now();

    try {
      const ok = await this.cache.ping();
      return {
        status: ok ? 'healthy' : 'degraded',
        latencyMs: Date.now() - startedAt,
        details: {
          ...details,
          response: ok ? 'PONG' : 'NO_RESPONSE',
        },
      };
    } catch (error) {
      return {
        status: 'degraded',
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'Cache check failed',
        details,
      };
    }
  }

  private async checkQueue(details: {
    host: string;
    port: number;
    db: number;
    password?: string;
  }): Promise<HealthCheckResult> {
    const startedAt = Date.now();
    const queue = new Queue('health-check', {
      connection: {
        host: details.host,
        port: details.port,
        db: details.db,
        password: details.password,
      },
    });
    const metricsQueue = new Queue(METRICS_QUEUE, {
      connection: {
        host: details.host,
        port: details.port,
        db: details.db,
        password: details.password,
      },
    });

    try {
      await queue.waitUntilReady();
      const [workers, repeatables] = await Promise.all([
        metricsQueue.getWorkers(),
        metricsQueue.getRepeatableJobs(),
      ]);
      return {
        status: 'healthy',
        latencyMs: Date.now() - startedAt,
        details: {
          ...details,
          queueName: 'health-check',
          metricsWorkerCount: workers.length,
          metricsRepeatableJobs: repeatables.length,
        },
      };
    } catch (error) {
      return {
        status: 'degraded',
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'Queue check failed',
        details,
      };
    } finally {
      await queue.close();
      await metricsQueue.close();
    }
  }

  private async checkSearch(details: {
    host: string;
  }): Promise<HealthCheckResult> {
    const startedAt = Date.now();

    try {
      const health = await this.search.health();
      return {
        status: health.status === 'available' ? 'healthy' : 'degraded',
        latencyMs: Date.now() - startedAt,
        details: {
          ...details,
          status: health.status,
        },
      };
    } catch (error) {
      return {
        status: 'degraded',
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'Search check failed',
        details,
      };
    }
  }

  private async checkStorage(details: {
    endpoint: string;
    port: number;
    bucket: string;
    useSSL: boolean;
  }): Promise<HealthCheckResult> {
    const startedAt = Date.now();

    try {
      const bucketExists = await this.storage
        .getClient()
        .bucketExists(details.bucket);
      return {
        status: bucketExists ? 'healthy' : 'degraded',
        latencyMs: Date.now() - startedAt,
        details: {
          ...details,
          bucketExists,
        },
      };
    } catch (error) {
      return {
        status: 'degraded',
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'Storage check failed',
        details,
      };
    }
  }

  private getConnectionDetails() {
    const redisHost = this.configService.get<string>(
      'DRAGONFLY_HOST',
      'localhost',
    );
    const redisPort = this.configService.get<number>('DRAGONFLY_PORT', 6379);
    const redisDb = this.configService.get<number>('DRAGONFLY_DB', 0);

    const queueHost = this.configService.get<string>(
      'DRAGONFLY_HOST',
      'localhost',
    );
    const queuePort = this.configService.get<number>('DRAGONFLY_PORT', 6379);
    const queueDb = this.configService.get<number>('BULLMQ_DB', 1);
    const queuePassword =
      this.configService.get<string>('DRAGONFLY_PASSWORD') || undefined;

    const searchHost = this.configService.get<string>(
      'MEILISEARCH_HOST',
      'http://localhost:7700',
    );

    const storageEndpoint = this.configService.get<string>(
      'MINIO_ENDPOINT',
      'localhost',
    );
    const storagePort = this.configService.get<number>('MINIO_PORT', 9000);
    const storageUseSSL = this.configService.get<boolean>(
      'MINIO_USE_SSL',
      false,
    );
    const storageBucket =
      this.configService.get<string>('MINIO_DEFAULT_BUCKET') ||
      this.configService.get<string>('MINIO_BUCKET', 'omnicassion');

    return {
      redis: {
        host: redisHost,
        port: redisPort,
        db: redisDb,
      },
      queue: {
        host: queueHost,
        port: queuePort,
        db: queueDb,
        password: queuePassword,
      },
      search: {
        host: searchHost,
      },
      storage: {
        endpoint: storageEndpoint,
        port: storagePort,
        bucket: storageBucket,
        useSSL: storageUseSSL,
      },
    };
  }
}
