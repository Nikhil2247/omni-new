// ============================================================================
// SEARCH ADMIN CONTROLLER - Search Index Management
// ============================================================================
// Admin endpoints for managing search indexes
// ============================================================================

import { Controller, Post, Get, Param } from '@nestjs/common';
import { VendorIndexer } from '../../../infrastructure/search/indexers/vendor.indexer';
import { EventIndexer } from '../../../infrastructure/search/indexers/event.indexer';
import {
  AdminOnly,
  Roles,
} from '../../../core/auth/decorators/roles.decorator';

@Controller('admin/search')
@AdminOnly()
export class SearchAdminController {
  constructor(
    private readonly vendorIndexer: VendorIndexer,
    private readonly eventIndexer: EventIndexer,
  ) {}

  /**
   * Get vendor index statistics
   * @route GET /api/admin/search/vendors/stats
   */
  @Get('vendors/stats')
  async getVendorIndexStats() {
    return this.vendorIndexer.getIndexStats();
  }

  /**
   * Reindex all vendors
   * @route POST /api/admin/search/vendors/reindex
   */
  @Post('vendors/reindex')
  async reindexVendors() {
    await this.vendorIndexer.reindexAll();
    return {
      message: 'Vendor reindexing started',
      status: 'processing',
    };
  }

  /**
   * Index a specific vendor
   * @route POST /api/admin/search/vendors/:vendorId/index
   */
  @Post('vendors/:vendorId/index')
  async indexVendor(@Param('vendorId') vendorId: string) {
    await this.vendorIndexer.indexVendor(vendorId);
    return {
      message: 'Vendor indexed successfully',
      vendorId,
    };
  }

  /**
   * Get event index statistics
   * @route GET /api/admin/search/events/stats
   */
  @Get('events/stats')
  async getEventIndexStats() {
    // TODO: Add getIndexStats to EventIndexer
    return {
      totalDocuments: 0,
      isIndexing: false,
    };
  }

  /**
   * Reindex all events
   * @route POST /api/admin/search/events/reindex
   */
  @Post('events/reindex')
  async reindexEvents() {
    await this.eventIndexer.reindexAll();
    return {
      message: 'Event reindexing started',
      status: 'processing',
    };
  }
}
