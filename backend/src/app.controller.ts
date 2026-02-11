// ============================================================================
// APP CONTROLLER - Health Checks & Root Endpoints
// ============================================================================
// Provides health check and readiness endpoints for container orchestration
// ============================================================================

import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'
import { AppService } from './app.service'
import { Public } from './core/auth/decorators/public.decorator'

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  environment: string
}

interface ReadinessResponse {
  status: 'ready' | 'not_ready'
  checks: {
    database: boolean
    cache: boolean
    search: boolean
  }
}

@ApiTags('Health')
@Controller()
@SkipThrottle()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Root endpoint' })
  @ApiResponse({ status: 200, description: 'Welcome message' })
  getHello(): { message: string; docs: string } {
    return {
      message: 'Omnicassion API v2.0',
      docs: '/docs',
    }
  }

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Application health status' })
  getHealth(): HealthCheckResponse {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '2.0.0',
      environment: process.env.NODE_ENV || 'development',
    }
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Readiness check endpoint' })
  @ApiResponse({ status: 200, description: 'Application readiness status' })
  async getReady(): Promise<ReadinessResponse> {
    const checks = await this.appService.checkDependencies()

    return {
      status: checks.database && checks.cache ? 'ready' : 'not_ready',
      checks,
    }
  }
}
