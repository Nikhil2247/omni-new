// ============================================================================
// USER GATEWAY MODULE - End User/Planner API Gateway
// ============================================================================
// API endpoints for event planning, vendor discovery, and user features
// ============================================================================

import { Module } from '@nestjs/common';
import { EventsController } from './controllers/events.controller';
import { DiscoveryController } from './controllers/discovery.controller';
import { InteractionsController } from './controllers/interactions.controller';
import { AccountController } from './controllers/account.controller';
import { ChecklistsController } from './controllers/checklists.controller';
import { GuestlistController } from './controllers/guestlist.controller';
import { BudgetController } from './controllers/budget.controller';
import { TimelineController } from './controllers/timeline.controller';
import { EventVendorsController } from './controllers/event-vendors.controller';
import { WishlistsController } from './controllers/wishlists.controller';
import { MemoriesController } from './controllers/memories.controller';
import { GuestUploadsController } from './controllers/guest-uploads.controller';
import { ExportController } from './controllers/export.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { OnboardingController } from './controllers/onboarding.controller';
import { WhatsAppController } from './controllers/whatsapp.controller';
import { NotificationsController } from './controllers/notifications.controller';
import { LookupsController } from './controllers/lookups.controller';
import { MessagingController } from './controllers/messaging.controller';
import { VendorFollowsController } from './controllers/vendor-follows.controller';
import { VendorReviewsController } from './controllers/vendor-reviews.controller';
import { PlannerInsightsController } from './controllers/planner-insights.controller';
import { UserSubscriptionController } from './controllers/user-subscription.controller';
import { PaymentController } from './controllers/payment.controller';
import { InvoiceController } from './controllers/invoice.controller';
import { EventCreditController } from './controllers/event-credit.controller';
import { EInviteController } from './controllers/einvite.controller';
import { CatalogModule } from '../../domain/catalog/catalog.module';
import { PlanningModule } from '../../domain/planning/planning.module';
import { LeadsModule } from '../../domain/leads/leads.module';
import { MessagingModule } from '../../domain/messaging/messaging.module';
import { ExportModule } from '../../infrastructure/export/export.module';
import { InsightsModule } from '../../domain/insights/insights.module';
import { SubscriptionModule } from '../../domain/subscription/subscription.module';
import { DatabaseModule } from '../../core/database/database.module';
import { NotificationService } from 'src/infrastructure/notifications/notification.service';
import { AuditService } from 'src/core/audit';

@Module({
  imports: [
    DatabaseModule,
    CatalogModule,
    PlanningModule,
    LeadsModule,
    MessagingModule,
    ExportModule,
    InsightsModule,
    SubscriptionModule,
  ],
  controllers: [
    EventsController,
    DiscoveryController,
    InteractionsController,
    AccountController,
    ChecklistsController,
    GuestlistController,
    BudgetController,
    TimelineController,
    EventVendorsController,
    WishlistsController,
    MemoriesController,
    GuestUploadsController,
    ExportController,
    AnalyticsController,
    OnboardingController,
    WhatsAppController,
    NotificationsController,
    LookupsController,
    MessagingController,
    PlannerInsightsController,
    VendorFollowsController,
    VendorReviewsController,
    UserSubscriptionController,
    PaymentController,
    InvoiceController,
    EventCreditController,
    EInviteController,
  ],
  providers: [NotificationService, AuditService],
})
export class UserGatewayModule {}
