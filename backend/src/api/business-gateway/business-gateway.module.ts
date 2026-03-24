// ============================================================================
// BUSINESS GATEWAY MODULE - Vendor/Business API Gateway
// ============================================================================
// API endpoints for vendor profile management, leads, analytics, etc.
// ============================================================================

import { Module } from '@nestjs/common';
import { ProfileController } from './controllers/profile.controller';
import { PortfolioController } from './controllers/portfolio.controller';
import { ServicesController } from './controllers/services.controller';
import { LeadsController } from './controllers/leads.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { CalendarController } from './controllers/calendar.controller';
import { AgreementsController } from './controllers/agreements.controller';
import { TasksController } from './controllers/tasks.controller';
import { MessagingController } from './controllers/messaging.controller';
import { VendorReviewsController } from './controllers/vendor-reviews.controller';
import { MediaTagsController } from './controllers/media-tags.controller';
import { LookupsController } from './controllers/lookups.controller';
import { KycController } from './controllers/kyc.controller';
import { ContractController } from './controllers/contract.controller';
import { ConsentController } from './controllers/consent.controller';
import { CampaignsController } from './controllers/campaigns.controller';
import { AdCreditsController } from './controllers/ad-credits.controller';
import { BusinessPaymentController } from './controllers/payment.controller';
import { BusinessInvoiceController } from './controllers/invoice.controller';
import { BusinessSubscriptionController } from './controllers/subscription.controller';
import { CouponController } from './controllers/coupon.controller';
import { CatalogModule } from '../../domain/catalog/catalog.module';
import { LeadsModule } from '../../domain/leads/leads.module';
import { OperationsModule } from '../../domain/operations/operations.module';
import { InsightsModule } from '../../domain/insights/insights.module';
import { PlanningModule } from '../../domain/planning/planning.module';
import { MessagingModule } from '../../domain/messaging/messaging.module';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { SubscriptionModule } from '../../domain/subscription/subscription.module';
import { DatabaseModule } from '../../core/database/database.module';
import { NotificationService } from 'src/infrastructure/notifications/notification.service';
import { AuditService } from 'src/core/audit';

@Module({
  imports: [
    DatabaseModule,
    CatalogModule,
    LeadsModule,
    OperationsModule,
    InsightsModule,
    PlanningModule,
    MessagingModule,
    StorageModule,
    SubscriptionModule,
  ],
  controllers: [
    ProfileController,
    PortfolioController,
    ServicesController,
    LeadsController,
    AnalyticsController,
    CalendarController,
    AgreementsController,
    TasksController,
    MessagingController,
    VendorReviewsController,
    MediaTagsController,
    LookupsController,
    KycController,
    ContractController,
    ConsentController,
    CampaignsController,
    AdCreditsController,
    BusinessPaymentController,
    BusinessInvoiceController,
    BusinessSubscriptionController,
    CouponController,
  ],
  providers: [NotificationService, AuditService],
})
export class BusinessGatewayModule {}
