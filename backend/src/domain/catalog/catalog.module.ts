// ============================================================================
// CATALOG MODULE - Vendor Catalog Domain Module
// ============================================================================
// Handles vendor profiles, portfolios, services, and discovery
// ============================================================================

import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';
import { CacheModule } from '../../infrastructure/cache/cache.module';
import { SubscriptionModule } from '../subscription/subscription.module';

// Services
import {
  VendorProfileService,
  PortfolioService,
  ServiceService,
  ServiceItemService,
  VendorReviewService,
  VendorFollowService,
  VendorBadgeService,
  MediaTagService,
  VendorClaimService,
} from './services';

// Repositories
import {
  VendorProfileRepository,
  PortfolioRepository,
  ServiceRepository,
  ServiceItemRepository,
  VendorClaimRepository,
} from './repositories';

// Event Handlers
import { VendorProfileEventHandler } from './events';

// Schedulers
import { ClaimScheduler } from './schedulers';

@Module({
  imports: [DatabaseModule, CacheModule, forwardRef(() => SubscriptionModule)],
  providers: [
    // Repositories
    VendorProfileRepository,
    PortfolioRepository,
    ServiceRepository,
    ServiceItemRepository,
    VendorClaimRepository,

    // Services
    VendorProfileService,
    PortfolioService,
    ServiceService,
    ServiceItemService,
    VendorReviewService,
    VendorFollowService,
    VendorBadgeService,
    MediaTagService,
    VendorClaimService,

    // Event Handlers
    VendorProfileEventHandler,

    // Schedulers
    ClaimScheduler,
  ],
  exports: [
    // Export services for use in other modules
    VendorProfileService,
    PortfolioService,
    ServiceService,
    ServiceItemService,
    VendorReviewService,
    VendorFollowService,
    VendorBadgeService,
    MediaTagService,
    VendorClaimService,
    // Export repositories for direct access if needed
    VendorProfileRepository,
    PortfolioRepository,
    ServiceRepository,
    ServiceItemRepository,
    VendorClaimRepository,
  ],
})
export class CatalogModule {}
