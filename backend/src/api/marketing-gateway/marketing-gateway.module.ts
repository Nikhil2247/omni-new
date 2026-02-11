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
import { NotificationService } from 'src/infrastructure/notifications/notification.service';

@Module({
  imports: [
    ContentModule,
  ],
  controllers: [
    CampaignsController,
    ContentController,
    MediaController,
    PromotionsController,
    CategoriesController
  ],
  providers: [
    NotificationService
  ]
})
export class MarketingGatewayModule {}
