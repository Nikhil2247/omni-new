// ============================================================================
// MARKETING GATEWAY MODULE - Marketing Team API Gateway
// ============================================================================
// API endpoints for content management, campaigns, and promotions
// ============================================================================

import { Module } from '@nestjs/common';
import { CampaignsController } from './controllers/campaigns.controller';
import { ContentController } from './controllers/content.controller';
import { MediaController } from './controllers/media.controller';
import { PromotionsController } from './controllers/promotions.controller';
import { CategoriesController } from './controllers/categories.controller';
import { ContentModule } from '../../domain/content/content.module';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { SubscriptionModule } from '../../domain/subscription/subscription.module';
import { NotificationService } from 'src/infrastructure/notifications/notification.service';
import { AuditService } from '@/core/audit';

@Module({
  imports: [ContentModule, StorageModule, SubscriptionModule],
  controllers: [
    CampaignsController,
    ContentController,
    MediaController,
    PromotionsController,
    CategoriesController,
  ],
  providers: [NotificationService, AuditService],
})
export class MarketingGatewayModule {}
