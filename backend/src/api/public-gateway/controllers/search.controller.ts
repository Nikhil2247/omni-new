// ============================================================================
// SEARCH CONTROLLER - Global Search API
// ============================================================================
// Public endpoints for global search functionality
// ============================================================================

import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../../../core/auth/decorators/public.decorator';
import { GlobalSearchService } from '../services/global-search.service';
import {
  GlobalSearchDto,
  QuickSearchDto,
  SearchSuggestionsDto,
} from '../dto/search.dto';
import { VendorIndexer } from '../../../infrastructure/search/indexers/vendor.indexer';
import { MediaUrlNormalizerService } from '../services/media-url-normalizer.service';

@Public()
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: GlobalSearchService,
    private readonly vendorIndexer: VendorIndexer,
    private readonly mediaUrlNormalizer: MediaUrlNormalizerService,
  ) {}

  /**
   * Global search endpoint
   * @route GET /api/search
   * @example /api/search?q=photographer&type=vendors&city=Mumbai&page=1&limit=20
   */
  @Get()
  async search(@Query() dto: GlobalSearchDto) {
    const result = await this.searchService.search(dto);
    return this.mediaUrlNormalizer.normalizeDeep(result);
  }

  /**
   * Quick search for autocomplete (limited results)
   * @route GET /api/search/quick
   * @example /api/search/quick?q=photo&limit=5
   */
  @Get('quick')
  async quickSearch(@Query() dto: QuickSearchDto) {
    const result = await this.searchService.quickSearch(dto);
    return this.mediaUrlNormalizer.normalizeDeep(result);
  }

  /**
   * Get search suggestions for autocomplete
   * @route GET /api/search/suggestions
   * @example /api/search/suggestions?q=photo&limit=8
   */
  @Get('suggestions')
  async getSuggestions(@Query() dto: SearchSuggestionsDto) {
    return this.searchService.getSuggestions(dto);
  }

  /**
   * Get search index statistics
   * @route GET /api/search/stats
   */
  @Get('stats')
  async getStats() {
    const stats = await this.vendorIndexer.getIndexStats();
    return {
      vendors: stats,
      message:
        stats.totalDocuments === 0
          ? 'No vendors indexed. Please run reindexing from admin panel or ensure vendors exist in database.'
          : `${stats.totalDocuments} vendors indexed`,
    };
  }
}
