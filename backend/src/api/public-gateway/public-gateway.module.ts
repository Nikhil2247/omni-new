import { Module } from '@nestjs/common';
import { WebhooksController } from './controllers/webhooks.controller';
import { DiscoveryController } from './controllers/discovery.controller';
import { HealthController } from './controllers/health.controller';
import { GuestUploadController } from './controllers/guest-upload.controller';
import { RsvpController } from './controllers/rsvp.controller';
import { CatalogModule } from '../../domain/catalog/catalog.module';
import { PlanningModule } from '../../domain/planning/planning.module';
import { ContentModule } from '../../domain/content/content.module';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { HealthModule } from '../../infrastructure/health/health.module';
import { BlogController } from './controllers/blog.controller';
import { MediaController } from './controllers/media.controller';
import { UploadController } from './controllers/upload.controller';
import { SystemStatusController } from './controllers/system-status.controller';
import { VendorReviewsController } from './controllers/vendor-reviews.controller';
import { MediaTagsController } from './controllers/media-tags.controller';
import { ChatbotController } from './controllers/chatbot.controller';
import { ChatbotService } from './services/chatbot.service';

@Module({
  imports: [CatalogModule, PlanningModule, ContentModule, StorageModule, HealthModule],
  controllers: [
    WebhooksController,
    DiscoveryController,
    HealthController,
    SystemStatusController,
    GuestUploadController,
    RsvpController,
    BlogController,
    MediaController,
    UploadController,
    VendorReviewsController,
    MediaTagsController,
    ChatbotController,
  ],
  providers: [ChatbotService],
})
export class PublicGatewayModule {}
