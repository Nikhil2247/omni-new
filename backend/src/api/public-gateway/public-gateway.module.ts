import { Module } from '@nestjs/common';
import { WebhooksController } from './controllers/webhooks.controller';
import { RazorpayWebhookController } from './controllers/razorpay-webhook.controller';
import { DiscoveryController } from './controllers/discovery.controller';
import { HealthController } from './controllers/health.controller';
import { GuestUploadController } from './controllers/guest-upload.controller';
import { RsvpController } from './controllers/rsvp.controller';
import { SearchController } from './controllers/search.controller';
import { QuoteApprovalController } from './controllers/quote-approval.controller';
// Plans controllers moved to PlansApiModule for direct /api/plans/* routes
import { CatalogModule } from '../../domain/catalog/catalog.module';
import { PlanningModule } from '../../domain/planning/planning.module';
import { ContentModule } from '../../domain/content/content.module';
import { OperationsModule } from '../../domain/operations/operations.module';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { HealthModule } from '../../infrastructure/health/health.module';
import { SearchModule } from '../../infrastructure/search/search.module';
import { ChatbotModule } from '../../domain/chatbot/chatbot.module';
import { SubscriptionModule } from '../../domain/subscription/subscription.module';
import { BlogController } from './controllers/blog.controller';
import { MediaController } from './controllers/media.controller';
import { UploadController } from './controllers/upload.controller';
import { SystemStatusController } from './controllers/system-status.controller';
import { VendorReviewsController } from './controllers/vendor-reviews.controller';
import { MediaTagsController } from './controllers/media-tags.controller';
import { ChatbotController } from './controllers/chatbot.controller';
import { PublicConsentController } from './controllers/consent.controller';
import { VendorClaimController } from './controllers/vendor-claim.controller';
import { AdsController } from './controllers/ads.controller';
import { FeaturesController } from './controllers/features.controller';
import { ChatbotService } from './services/chatbot.service';
import { GlobalSearchService } from './services/global-search.service';
import { MediaUrlNormalizerService } from './services/media-url-normalizer.service';
import { ChatbotPersistenceService } from '../../domain/chatbot/services/chatbot-persistence.service';

@Module({
  imports: [
    CatalogModule,
    PlanningModule,
    ContentModule,
    OperationsModule,
    StorageModule,
    HealthModule,
    SearchModule,
    ChatbotModule,
    SubscriptionModule,
  ],
  controllers: [
    WebhooksController,
    RazorpayWebhookController,
    DiscoveryController,
    HealthController,
    SystemStatusController,
    GuestUploadController,
    RsvpController,
    QuoteApprovalController,
    BlogController,
    MediaController,
    UploadController,
    VendorReviewsController,
    MediaTagsController,
    ChatbotController,
    SearchController,
    PublicConsentController,
    VendorClaimController,
    AdsController,
    FeaturesController,
  ],
  providers: [ChatbotService, GlobalSearchService, MediaUrlNormalizerService, ChatbotPersistenceService],
})
export class PublicGatewayModule {}
