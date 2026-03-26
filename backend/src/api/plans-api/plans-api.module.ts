// ============================================================================
// PLANS API MODULE - Subscription Plans Public API
// ============================================================================
// Public endpoints for subscription plans without gateway prefix
// Routes: /api/plans/vendor, /api/plans/user
// ============================================================================

import { Module } from '@nestjs/common';
import { VendorPlansController } from './controllers/vendor-plans.controller';
import { UserPlansController } from './controllers/user-plans.controller';
import { EventCreditProductsController } from './controllers/event-credit-products.controller';
import { SubscriptionModule } from '../../domain/subscription/subscription.module';

@Module({
  imports: [SubscriptionModule],
  controllers: [VendorPlansController, UserPlansController, EventCreditProductsController],
  providers: [],
})
export class PlansApiModule {}
