import { Controller, Get, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../core/auth/guards/roles.guard'
import { SystemAdminOnly } from '../../../core/auth/decorators/roles.decorator'
import { SystemHealthService } from '../services/system-health.service'

@Controller('system-health')
@UseGuards(JwtAuthGuard, RolesGuard)
@SystemAdminOnly()
export class SystemHealthController {
  constructor(private readonly systemHealth: SystemHealthService) {}

  @Get()
  async getHealth() {
    return this.systemHealth.getHealth()
  }
}
