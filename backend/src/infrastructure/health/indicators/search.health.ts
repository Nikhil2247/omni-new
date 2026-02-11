// ============================================================================
// SEARCH HEALTH INDICATOR - Meilisearch Health Check
// ============================================================================

import { Injectable } from '@nestjs/common'
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class SearchHealthIndicator extends HealthIndicator {
  private readonly searchUrl: string

  constructor(private readonly configService: ConfigService) {
    super()
    this.searchUrl = this.configService.get<string>('MEILISEARCH_URL', 'http://localhost:7700')
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now()

      // Call Meilisearch health endpoint
      const response = await fetch(`${this.searchUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      })

      const latency = Date.now() - startTime

      if (!response.ok) {
        throw new Error(`Meilisearch returned status ${response.status}`)
      }

      const data = await response.json()

      return this.getStatus(key, true, {
        latency,
        connected: true,
        status: data.status || 'available',
      })
    } catch (error) {
      throw new HealthCheckError(
        'Search health check failed',
        this.getStatus(key, false, {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      )
    }
  }
}
