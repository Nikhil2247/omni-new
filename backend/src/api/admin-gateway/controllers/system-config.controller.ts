import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { SystemAdminOnly } from '../../../core/auth/decorators/roles.decorator';
import { UserId } from '../../../core/auth/decorators/current-user.decorator';
import { SystemConfigService } from '../services/system-config.service';
import { UpdateSystemConfigDto } from '../dto/system-config.dto';

@Controller('system-config')
@UseGuards(JwtAuthGuard, RolesGuard)
@SystemAdminOnly()
export class SystemConfigController {
  constructor(private readonly systemConfig: SystemConfigService) {}

  @Get()
  async getConfig() {
    const config = await this.systemConfig.getConfig();
    return {
      maintenanceMode: config.maintenanceMode,
      registrationEnabled: config.registrationEnabled,
      allowVendorOnboarding: config.allowVendorOnboarding,
      supportEmail: config.supportEmail ?? null,
      environment: process.env.NODE_ENV ?? 'development',
    };
  }

  @Put()
  async updateConfig(
    @Body() dto: UpdateSystemConfigDto,
    @UserId() userId: string,
  ) {
    const config = await this.systemConfig.updateConfig(dto, userId);
    return {
      maintenanceMode: config.maintenanceMode,
      registrationEnabled: config.registrationEnabled,
      allowVendorOnboarding: config.allowVendorOnboarding,
      supportEmail: config.supportEmail ?? null,
      environment: process.env.NODE_ENV ?? 'development',
    };
  }
}
