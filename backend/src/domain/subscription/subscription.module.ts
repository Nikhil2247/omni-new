// ============================================================================
// SUBSCRIPTION MODULE - Subscription & Billing Domain
// ============================================================================
// Handles subscription plans, billing, payments, feature gating, and campaigns
// ============================================================================

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';

// Services
import {
  SubscriptionPlanService,
  SubscriptionService,
  UsageService,
  BillingService,
  CampaignService,
  AdCreditService,
  UserSubscriptionPlanService,
  UserSubscriptionService,
  UserUsageService,
  InvoiceGeneratorService,
  SubscriptionEmailService,
  CouponService,
  PaymentRetryService,
  EventCreditService,
} from './services';
import { CampaignDisplayService } from './services/campaign-display.service';

// Repositories
import {
  SubscriptionPlanRepository,
  SubscriptionRepository,
  UsageRepository,
  InvoiceRepository,
  PaymentRepository,
  PaymentMethodRepository,
  CampaignRepository,
  AdCreditRepository,
  EventCreditRepository,
} from './repositories';
import { UserSubscriptionRepository } from './repositories/user-subscription.repository';
import { UserPlanRepository } from './repositories/user-plan.repository';

// Schedulers
import {
  CampaignScheduler,
  PaymentRetryScheduler,
  SubscriptionScheduler,
  TrialScheduler,
} from './schedulers';

// Event Listeners
import {
  SubscriptionEventListener,
  SubscriptionNotificationListener,
  SubscriptionEmailListener,
} from './events';

// Razorpay Service (for schedulers)
import { RazorpayService } from './services/razorpay.service';

// Guards
import {
  SubscriptionGuard,
  ActiveSubscriptionGuard,
  UserSubscriptionGuard,
} from './guards';

@Module({
  imports: [DatabaseModule],
  providers: [
    // Services
    SubscriptionPlanService,
    SubscriptionService,
    UsageService,
    BillingService,
    CampaignService,
    AdCreditService,
    UserSubscriptionPlanService,
    UserSubscriptionService,
    UserUsageService,
    InvoiceGeneratorService,
    SubscriptionEmailService,
    CampaignDisplayService,
    CouponService,
    PaymentRetryService,
    EventCreditService,

    // Repositories
    SubscriptionPlanRepository,
    SubscriptionRepository,
    UsageRepository,
    InvoiceRepository,
    PaymentRepository,
    PaymentMethodRepository,
    CampaignRepository,
    AdCreditRepository,
    EventCreditRepository,
    UserSubscriptionRepository,
    UserPlanRepository,

    // Schedulers
    CampaignScheduler,
    PaymentRetryScheduler,
    SubscriptionScheduler,
    TrialScheduler,

    // Event Listeners
    SubscriptionEventListener,
    SubscriptionNotificationListener,
    SubscriptionEmailListener,

    // External Services
    RazorpayService,

    // Guards
    SubscriptionGuard,
    ActiveSubscriptionGuard,
    UserSubscriptionGuard,
  ],
  exports: [
    // Services
    SubscriptionPlanService,
    SubscriptionService,
    UsageService,
    BillingService,
    CampaignService,
    AdCreditService,
    UserSubscriptionPlanService,
    UserSubscriptionService,
    UserUsageService,
    RazorpayService,
    InvoiceGeneratorService,
    SubscriptionEmailService,
    CampaignDisplayService,
    CouponService,
    PaymentRetryService,
    EventCreditService,

    // Repositories (for use in other modules)
    SubscriptionRepository,
    CampaignRepository,
    AdCreditRepository,
    EventCreditRepository,

    // Guards (for use in other modules)
    SubscriptionGuard,
    ActiveSubscriptionGuard,
    UserSubscriptionGuard,

    // User Subscription Repositories (for use in other modules)
    UserSubscriptionRepository,
    UserPlanRepository,
  ],
})
export class SubscriptionModule {}
