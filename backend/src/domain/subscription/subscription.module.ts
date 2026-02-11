// ============================================================================
// SUBSCRIPTION MODULE - Subscription & Billing Domain
// ============================================================================
// Handles subscription plans, billing, payments, and feature gating
// ============================================================================

import { Module } from '@nestjs/common'
import { DatabaseModule } from '../../core/database/database.module'

// Services
import {
  SubscriptionPlanService,
  SubscriptionService,
  UsageService,
  BillingService,
} from './services'

// Repositories
import {
  SubscriptionPlanRepository,
  SubscriptionRepository,
  UsageRepository,
  InvoiceRepository,
  PaymentRepository,
  PaymentMethodRepository,
} from './repositories'

// Event Listeners
import { SubscriptionEventListener } from './events'

// Guards
import { SubscriptionGuard, ActiveSubscriptionGuard } from './guards'

@Module({
  imports: [DatabaseModule],
  providers: [
    // Services
    SubscriptionPlanService,
    SubscriptionService,
    UsageService,
    BillingService,

    // Repositories
    SubscriptionPlanRepository,
    SubscriptionRepository,
    UsageRepository,
    InvoiceRepository,
    PaymentRepository,
    PaymentMethodRepository,

    // Event Listeners
    SubscriptionEventListener,

    // Guards
    SubscriptionGuard,
    ActiveSubscriptionGuard,
  ],
  exports: [
    // Services
    SubscriptionPlanService,
    SubscriptionService,
    UsageService,
    BillingService,

    // Guards (for use in other modules)
    SubscriptionGuard,
    ActiveSubscriptionGuard,
  ],
})
export class SubscriptionModule {}
