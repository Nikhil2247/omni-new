// ============================================================================
// GLOBAL SEARCH SERVICE - Multi-Index Search
// ============================================================================
// Provides unified search across vendors, events, and content
// ============================================================================

import { Injectable, Logger } from '@nestjs/common'
import { VendorIndexer } from '../../../infrastructure/search/indexers/vendor.indexer'
import { EventIndexer } from '../../../infrastructure/search/indexers/event.indexer'
import { MeilisearchService } from '../../../infrastructure/search/meilisearch.service'
import { GlobalSearchDto, SearchType, QuickSearchDto, SearchSuggestionsDto } from '../dto/search.dto'

export interface SearchResultItem {
  id: string
  type: 'vendor' | 'event' | 'content'
  title: string
  description?: string
  slug?: string
  imageUrl?: string
  category?: string
  location?: string
  price?: number
  rating?: number
  isVerified?: boolean
  _matchScore?: number
}

export interface GlobalSearchResponse {
  results: SearchResultItem[]
  meta: {
    query: string
    totalResults: number
    page: number
    limit: number
    totalPages: number
    processingTimeMs: number
    type: SearchType
  }
  facets?: {
    categories?: Record<string, number>
    locations?: Record<string, number>
    priceRanges?: Record<string, number>
  }
}

@Injectable()
export class GlobalSearchService {
  private readonly logger = new Logger(GlobalSearchService.name)

  constructor(
    private readonly vendorIndexer: VendorIndexer,
    private readonly eventIndexer: EventIndexer,
    private readonly meilisearchService: MeilisearchService,
  ) {}

  /**
   * Global search across all types or specific type
   */
  async search(dto: GlobalSearchDto): Promise<GlobalSearchResponse> {
    const startTime = Date.now()

    try {
      if (dto.type === SearchType.VENDORS) {
        return await this.searchVendors(dto, startTime)
      }

      if (dto.type === SearchType.EVENTS) {
        return await this.searchEvents(dto, startTime)
      }

      if (dto.type === SearchType.CONTENT) {
        return await this.searchContent(dto, startTime)
      }

      // Search all types
      return await this.searchAll(dto, startTime)
    } catch (error) {
      this.logger.error('Global search failed', error)
      throw error
    }
  }

  /**
   * Quick search for autocomplete/suggestions (multi-type)
   */
  async quickSearch(dto: QuickSearchDto): Promise<SearchResultItem[]> {
    try {
      const limit = dto.limit ?? 5
      const vendors = await this.vendorIndexer.searchVendors(dto.q, {
        hitsPerPage: limit,
      })

      const results: SearchResultItem[] = []

      // Add vendors
      if (vendors?.hits && Array.isArray(vendors.hits)) {
        results.push(
          ...vendors.hits.slice(0, limit).map((hit: any) => ({
            id: hit.id,
            type: 'vendor' as const,
            title: hit.businessName,
            description: hit.tagline,
            slug: hit.slug,
            imageUrl: hit.logo,
            category: hit.categoryName,
            location: [hit.city, hit.state].filter(Boolean).join(', '),
            isVerified: hit.isVerified,
            _matchScore: hit._matchScore,
          })),
        )
      }

      return results.slice(0, limit)
    } catch (error) {
      this.logger.error('Quick search failed', error)
      return []
    }
  }

  /**
   * Get search suggestions for autocomplete
   */
  async getSuggestions(dto: SearchSuggestionsDto): Promise<string[]> {
    try {
      const limit = dto.limit ?? 8
      const suggestions = await this.vendorIndexer.getVendorSuggestions(dto.q, limit)
      
      if (!suggestions || !Array.isArray(suggestions)) {
        return []
      }

      return suggestions.slice(0, limit)
    } catch (error) {
      this.logger.error('Get suggestions failed', error)
      return []
    }
  }

  /**
   * Search vendors only
   */
  private async searchVendors(dto: GlobalSearchDto, startTime: number): Promise<GlobalSearchResponse> {
    const sortBy = dto.sortBy === 'relevance' || dto.sortBy === 'recent' || dto.sortBy === 'popular' 
      ? undefined 
      : dto.sortBy as 'createdAt' | 'viewCount' | 'leadCount' | 'minPrice' | undefined

    const result = await this.vendorIndexer.searchVendors(dto.q, {
      page: dto.page,
      hitsPerPage: dto.limit,
      categoryId: dto.categoryId,
      city: dto.city,
      country: dto.country,
      priceMin: dto.priceMin,
      priceMax: dto.priceMax,
      isVerified: dto.isVerified,
      sortBy,
    })

    const processingTimeMs = Date.now() - startTime

    return {
      results: result.hits.map((hit: any) => ({
        id: hit.id,
        type: 'vendor',
        title: hit.businessName,
        description: hit.description,
        slug: hit.slug,
        imageUrl: hit.logo,
        category: hit.categoryName,
        location: [hit.city, hit.state, hit.country].filter(Boolean).join(', '),
        price: hit.minPrice,
        isVerified: hit.isVerified,
        _matchScore: hit._matchScore,
      })),
      meta: {
        query: dto.q,
        totalResults: result.totalHits,
        page: dto.page || 1,
        limit: dto.limit || 20,
        totalPages: result.totalPages,
        processingTimeMs: result.processingTimeMs + processingTimeMs,
        type: SearchType.VENDORS,
      },
      facets: result.facetDistribution,
    }
  }

  /**
   * Search events only
   */
  private async searchEvents(dto: GlobalSearchDto, startTime: number): Promise<GlobalSearchResponse> {
    // Placeholder for event search - implement when needed
    const processingTimeMs = Date.now() - startTime

    return {
      results: [],
      meta: {
        query: dto.q,
        totalResults: 0,
        page: dto.page || 1,
        limit: dto.limit || 20,
        totalPages: 0,
        processingTimeMs,
        type: SearchType.EVENTS,
      },
    }
  }

  /**
   * Search content only (blogs, articles, etc.)
   */
  private async searchContent(dto: GlobalSearchDto, startTime: number): Promise<GlobalSearchResponse> {
    // Placeholder for content search - implement when needed
    const processingTimeMs = Date.now() - startTime

    return {
      results: [],
      meta: {
        query: dto.q,
        totalResults: 0,
        page: dto.page || 1,
        limit: dto.limit || 20,
        totalPages: 0,
        processingTimeMs,
        type: SearchType.CONTENT,
      },
    }
  }

  /**
   * Search all types
   */
  private async searchAll(dto: GlobalSearchDto, startTime: number): Promise<GlobalSearchResponse> {
    // Search vendors (primary results for now)
    const vendorResults = await this.searchVendors(
      { ...dto, limit: dto.limit || 20 },
      startTime,
    )

    // You can extend this to include events and content
    // const [vendorResults, eventResults, contentResults] = await Promise.all([...])

    return {
      ...vendorResults,
      meta: {
        ...vendorResults.meta,
        type: SearchType.ALL,
      },
    }
  }
}
