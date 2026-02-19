// ============================================================================
// HEALTH SERVICE - Aggregated Health Check Service
// ============================================================================
// Provides comprehensive health checks for all infrastructure dependencies
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './indicators/database.health';
import { CacheHealthIndicator } from './indicators/cache.health';
import { SearchHealthIndicator } from './indicators/search.health';
import { StorageHealthIndicator } from './indicators/storage.health';
import { JobsHealthIndicator } from './indicators/jobs.health';

export interface HealthCheckResult {
  status: 'ok' | 'error' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: { status: string; latency?: number; details?: unknown };
    cache: { status: string; latency?: number; details?: unknown };
    search: { status: string; latency?: number; details?: unknown };
    storage: { status: string; latency?: number; details?: unknown };
    jobs: { status: string; latency?: number; details?: unknown };
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    private health: HealthCheckService,
    private database: DatabaseHealthIndicator,
    private cache: CacheHealthIndicator,
    private search: SearchHealthIndicator,
    private storage: StorageHealthIndicator,
    private jobs: JobsHealthIndicator,
  ) {}

  /**
   * Quick health check - just confirms service is running
   */
  async ping(): Promise<{ status: 'ok'; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness check - confirms all dependencies are ready
   */
  @HealthCheck()
  async checkReadiness(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const results: HealthCheckResult = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: { status: 'unknown' },
        cache: { status: 'unknown' },
        search: { status: 'unknown' },
        storage: { status: 'unknown' },
        jobs: { status: 'unknown' },
      },
    };

    // Check all services in parallel
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkCache(),
      this.checkSearch(),
      this.checkStorage(),
      this.checkJobs(),
    ]);

    // Process database result
    if (checks[0].status === 'fulfilled') {
      results.services.database = checks[0].value;
    } else {
      results.services.database = {
        status: 'error',
        details: checks[0].reason?.message,
      };
      results.status = 'error';
    }

    // Process cache result
    if (checks[1].status === 'fulfilled') {
      results.services.cache = checks[1].value;
    } else {
      results.services.cache = {
        status: 'error',
        details: checks[1].reason?.message,
      };
      results.status = results.status === 'ok' ? 'degraded' : results.status;
    }

    // Process search result
    if (checks[2].status === 'fulfilled') {
      results.services.search = checks[2].value;
    } else {
      results.services.search = {
        status: 'error',
        details: checks[2].reason?.message,
      };
      results.status = results.status === 'ok' ? 'degraded' : results.status;
    }

    // Process storage result
    if (checks[3].status === 'fulfilled') {
      results.services.storage = checks[3].value;
    } else {
      results.services.storage = {
        status: 'error',
        details: checks[3].reason?.message,
      };
      results.status = results.status === 'ok' ? 'degraded' : results.status;
    }

    // Process jobs result
    if (checks[4].status === 'fulfilled') {
      results.services.jobs = checks[4].value;
    } else {
      results.services.jobs = {
        status: 'error',
        details: checks[4].reason?.message,
      };
      results.status = results.status === 'ok' ? 'degraded' : results.status;
    }

    const totalLatency = Date.now() - startTime;
    this.logger.debug(
      `Health check completed in ${totalLatency}ms - Status: ${results.status}`,
    );

    return results;
  }

  /**
   * Liveness check - confirms service is alive (for Kubernetes)
   */
  async checkLiveness(): Promise<{
    status: 'ok' | 'error';
    timestamp: string;
  }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<{
    status: string;
    latency?: number;
    details?: unknown;
  }> {
    const start = Date.now();
    const result = await this.database.isHealthy('database');
    return {
      status: result.database?.status || 'unknown',
      latency: Date.now() - start,
      details: result.database,
    };
  }

  private async checkCache(): Promise<{
    status: string;
    latency?: number;
    details?: unknown;
  }> {
    const start = Date.now();
    const result = await this.cache.isHealthy('cache');
    return {
      status: result.cache?.status || 'unknown',
      latency: Date.now() - start,
      details: result.cache,
    };
  }

  private async checkSearch(): Promise<{
    status: string;
    latency?: number;
    details?: unknown;
  }> {
    const start = Date.now();
    const result = await this.search.isHealthy('search');
    return {
      status: result.search?.status || 'unknown',
      latency: Date.now() - start,
      details: result.search,
    };
  }

  private async checkStorage(): Promise<{
    status: string;
    latency?: number;
    details?: unknown;
  }> {
    const start = Date.now();
    const result = await this.storage.isHealthy('storage');
    return {
      status: result.storage?.status || 'unknown',
      latency: Date.now() - start,
      details: result.storage,
    };
  }

  private async checkJobs(): Promise<{
    status: string;
    latency?: number;
    details?: unknown;
  }> {
    const start = Date.now();
    const result = await this.jobs.isHealthy('jobs');
    return {
      status: result.jobs?.status || 'unknown',
      latency: Date.now() - start,
      details: result.jobs,
    };
  }
}
