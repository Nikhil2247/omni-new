// ============================================================================
// SEARCH MODULE - Full-Text Search Services
// ============================================================================
// Provides Meilisearch integration and domain-specific indexers
// ============================================================================

import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MeilisearchService } from './meilisearch.service';
import { EventIndexer } from './indexers/event.indexer';
import { VendorIndexer } from './indexers/vendor.indexer';
import { DatabaseModule } from '../../core/database/database.module';

@Global()
@Module({
  imports: [ConfigModule, DatabaseModule],
  providers: [MeilisearchService, EventIndexer, VendorIndexer],
  exports: [MeilisearchService, EventIndexer, VendorIndexer],
})
export class SearchModule {}
