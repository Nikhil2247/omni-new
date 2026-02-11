import { Module } from '@nestjs/common'
import { UsersController } from './controllers/users.controller'
import { RolesController } from './controllers/roles.controller'
import { SystemConfigController } from './controllers/system-config.controller'
import { AuditController } from './controllers/audit.controller'
import { InsightsController } from './controllers/insights.controller'
import { InsightsModule } from 'src/domain'
import { SystemConfigService } from './services/system-config.service'
import { SystemHealthController } from './controllers/system-health.controller'
import { SystemHealthService } from './services/system-health.service'
import { FeatureFlagController } from './controllers/feature-flag.controller'
import { FeatureFlagService } from './services/feature-flag.service'
import { AuditService } from 'src/core/audit'


@Module({
  imports: [InsightsModule],
  controllers: [
    UsersController,
    RolesController,
    SystemConfigController,
    AuditController,
    InsightsController,
    SystemHealthController,
    FeatureFlagController,
  ],
  providers: [SystemConfigService, SystemHealthService, FeatureFlagService, AuditService],
})
export class AdminGatewayModule {}
