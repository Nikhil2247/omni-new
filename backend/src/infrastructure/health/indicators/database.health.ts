// ============================================================================
// DATABASE HEALTH INDICATOR - PostgreSQL Health Check
// ============================================================================

import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();

      // Execute a simple query to check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;

      const latency = Date.now() - startTime;

      // Get connection pool stats if available
      const poolInfo = {
        latency,
        connected: true,
      };

      return this.getStatus(key, true, poolInfo);
    } catch (error) {
      throw new HealthCheckError(
        'Database health check failed',
        this.getStatus(key, false, {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }
}
