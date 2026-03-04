// ============================================================================
// CATALOG MODULE - Vendor Catalog Domain Module
// ============================================================================
// Handles vendor profiles, portfolios, services, and discovery
// ============================================================================

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';

// Services
import {
  VendorProfileService,
  PortfolioService,
  ServiceService,
  VendorReviewService,
  VendorFollowService,
  VendorBadgeService,
  MediaTagService,
} from './services';

// Repositories
import {
  VendorProfileRepository,
  PortfolioRepository,
  ServiceRepository,
} from './repositories';

// Event Handlers
import { VendorProfileEventHandler } from './events';

@Module({
  imports: [DatabaseModule],
  providers: [
    // Repositories
    VendorProfileRepository,
    PortfolioRepository,
    ServiceRepository,

    // Services
    VendorProfileService,
    PortfolioService,
    ServiceService,
    VendorReviewService,
    VendorFollowService,
    VendorBadgeService,
    MediaTagService,

    // Event Handlers
    VendorProfileEventHandler,
  ],
  exports: [
    // Export services for use in other modules
    VendorProfileService,
    PortfolioService,
    ServiceService,
    VendorReviewService,
    VendorFollowService,
    VendorBadgeService,
    MediaTagService,
    // Export repositories for direct access if needed
    VendorProfileRepository,
    PortfolioRepository,
    ServiceRepository,
  ],
})
export class CatalogModule {}
