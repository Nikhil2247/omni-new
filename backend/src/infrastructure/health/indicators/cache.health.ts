// ============================================================================
// CACHE HEALTH INDICATOR - Dragonfly/Redis Health Check
// ============================================================================

import { Injectable } from '@nestjs/common'
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus'
import { DragonflyService } from '../../cache/dragonfly.service'

@Injectable()
export class CacheHealthIndicator extends HealthIndicator {
  constructor(private readonly cache: DragonflyService) {
    super()
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now()

      // Ping the cache server
      const isConnected = await this.cache.ping()

      const latency = Date.now() - startTime

      if (!isConnected) {
        throw new Error('Cache ping failed')
      }

      // Try to get cache info for additional metrics
      let info: Record<string, unknown> = {}
      try {
        const infoStr = await this.cache.info()
        // Parse basic info
        const lines = infoStr.split('\n')
        for (const line of lines) {
          if (line.startsWith('used_memory_human:')) {
            info.usedMemory = line.split(':')[1]?.trim()
          }
          if (line.startsWith('connected_clients:')) {
            info.connectedClients = parseInt(line.split(':')[1]?.trim() || '0', 10)
          }
          if (line.startsWith('uptime_in_seconds:')) {
            info.uptimeSeconds = parseInt(line.split(':')[1]?.trim() || '0', 10)
          }
        }
      } catch {
        // Info is optional, don't fail health check
      }

      return this.getStatus(key, true, {
        latency,
        connected: true,
        ...info,
      })
    } catch (error) {
      throw new HealthCheckError(
        'Cache health check failed',
        this.getStatus(key, false, {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      )
    }
  }
}
