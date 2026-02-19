import { Controller, Get } from '@nestjs/common';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { HealthService } from '../../../infrastructure/health/health.service';
import { SkipRateLimit } from '../../../infrastructure/rate-limiting/rate-limiting.decorator';

@Controller('health')
@Public()
@SkipRateLimit()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Quick liveness probe - confirms service is running
   * Used by load balancers and Kubernetes liveness probes
   */
  @Get()
  check() {
    return this.healthService.ping();
  }

  /**
   * Detailed readiness check - confirms all dependencies are ready
   * Used by Kubernetes readiness probes and monitoring
   */
  @Get('ready')
  async ready() {
    return this.healthService.checkReadiness();
  }

  /**
   * Liveness check - confirms service is alive
   */
  @Get('live')
  async live() {
    return this.healthService.checkLiveness();
  }
}
