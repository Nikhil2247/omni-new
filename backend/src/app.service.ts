// ============================================================================
// APP SERVICE - Application Health & Diagnostics
// ============================================================================
// Provides dependency health checks for readiness probes
// ============================================================================

import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from './core/database/prisma.service'
import { DragonflyService } from './infrastructure/cache/dragonfly.service'
import { MeilisearchService } from './infrastructure/search/meilisearch.service'

export interface DependencyChecks {
  database: boolean
  cache: boolean
  search: boolean
}

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: DragonflyService,
    private readonly search: MeilisearchService,
  ) {}

  getHello(): string {
    return 'Omnicassion API v2.0'
  }

  async checkDependencies(): Promise<DependencyChecks> {
    const checks: DependencyChecks = {
      database: false,
      cache: false,
      search: false,
    }

    // Check database connection
    try {
      await this.prisma.$queryRaw`SELECT 1`
      checks.database = true
    } catch (error) {
      this.logger.error('Database health check failed', error)
      checks.database = false
    }

    // Check cache connection
    try {
      checks.cache = await this.cache.ping()
    } catch (error) {
      this.logger.error('Cache health check failed', error)
      checks.cache = false
    }

    // Check search connection
    try {
      checks.search = await this.search.healthCheck()
    } catch (error) {
      this.logger.error('Search health check failed', error)
      checks.search = false
    }

    return checks
  }
}
