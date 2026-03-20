import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { RolesController } from './controllers/roles.controller';
import { SystemConfigController } from './controllers/system-config.controller';
import { AuditController } from './controllers/audit.controller';
import { InsightsController } from './controllers/insights.controller';
import { SearchAdminController } from './controllers/search-admin.controller';
import { AdminPaymentController } from './controllers/admin-payment.controller';
import { AdminSubscriptionController } from './controllers/admin-subscription.controller';
import { AdminInvoiceController } from './controllers/admin-invoice.controller';
import { AdminCampaignController } from './controllers/admin-campaign.controller';
import { InsightsModule } from 'src/domain';
import { SubscriptionModule } from 'src/domain/subscription/subscription.module';
import { SearchModule } from '../../infrastructure/search/search.module';
import { SystemConfigService } from './services/system-config.service';
import { SystemHealthController } from './controllers/system-health.controller';
import { SystemHealthService } from './services/system-health.service';
import { FeatureFlagController } from './controllers/feature-flag.controller';
import { FeatureFlagService } from './services/feature-flag.service';
import { ChatbotAdminController } from './controllers/chatbot-admin.controller';
import { ChatbotAdminService } from './services/chatbot-admin.service';
import { AuditService } from 'src/core/audit';

@Module({
  imports: [InsightsModule, SearchModule, SubscriptionModule],
  controllers: [
    UsersController,
    RolesController,
    SystemConfigController,
    AuditController,
    InsightsController,
    SystemHealthController,
    FeatureFlagController,
    SearchAdminController,
    ChatbotAdminController,
    AdminPaymentController,
    AdminSubscriptionController,
    AdminInvoiceController,
    AdminCampaignController,
  ],
  providers: [
    SystemConfigService,
    SystemHealthService,
    FeatureFlagService,
    ChatbotAdminService,
    AuditService,
  ],
})
export class AdminGatewayModule {}
