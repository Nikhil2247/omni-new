// ============================================================================
// JOBS HEALTH INDICATOR - BullMQ/Redis Health Check
// ============================================================================

import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { DragonflyService } from '../../cache/dragonfly.service';

@Injectable()
export class JobsHealthIndicator extends HealthIndicator {
  constructor(private readonly cache: DragonflyService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();

      // BullMQ uses Redis/Dragonfly, so we check that connection
      const isConnected = await this.cache.ping();

      const latency = Date.now() - startTime;

      if (!isConnected) {
        throw new Error('Job queue backend (Redis/Dragonfly) ping failed');
      }

      // Try to get queue stats
      let queueStats: Record<string, unknown> = {};
      try {
        // Check for bull queues by looking at keys
        const client = this.cache.getClient();

        // Get counts of different queue states
        const waitingKeys = await client.keys('bull:*:wait');
        const activeKeys = await client.keys('bull:*:active');
        const completedKeys = await client.keys('bull:*:completed');
        const failedKeys = await client.keys('bull:*:failed');

        queueStats = {
          queuesWithWaiting: waitingKeys.length,
          queuesWithActive: activeKeys.length,
          queuesWithCompleted: completedKeys.length,
          queuesWithFailed: failedKeys.length,
        };
      } catch {
        // Queue stats are optional
      }

      return this.getStatus(key, true, {
        latency,
        connected: true,
        ...queueStats,
      });
    } catch (error) {
      throw new HealthCheckError(
        'Jobs health check failed',
        this.getStatus(key, false, {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }
}
