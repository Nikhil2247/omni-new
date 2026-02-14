// ============================================================================
// VENDOR INDEXER - Search Index for Vendors
// ============================================================================
// Manages indexing of vendors for full-text search with Meilisearch
// Supports geo-search, filtering by category, rating, service type, etc.
// ============================================================================

import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { MeilisearchService, IndexConfig } from '../meilisearch.service'
import { PrismaService } from '../../../core/database/prisma.service'

export const VENDOR_INDEX_NAME = 'vendors'

export interface VendorSearchDocument extends Record<string, unknown> {
  id: string
  businessName: string
  slug: string
  tagline?: string
  description: string
  categoryId: string
  categoryName: string
  categorySlug: string
  status: string
  verificationStatus: string
  city?: string
  state?: string
  country?: string
  isVerified: boolean
  leadCount: number
  viewCount: number
  minPrice?: number
  maxPrice?: number
  services?: string[]
  tags?: string[]
  serviceAreas?: string[]
  _geo?: { lat: number; lng: number }
  createdAt: number
  updatedAt: number
}

@Injectable()
export class VendorIndexer implements OnModuleInit {
  private readonly logger = new Logger(VendorIndexer.name)

  constructor(
    private readonly search: MeilisearchService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureIndexExists()
    
    // Check if index is empty and there are vendors in DB
    try {
      const stats = await this.getIndexStats()
      const vendorCount = await this.prisma.vendorProfile.count({})
      
      if (stats.totalDocuments === 0 && vendorCount > 0) {
        this.logger.warn(
          `Vendor index is empty but ${vendorCount} vendors exist in database. Triggering automatic reindex...`,
        )
        // Trigger reindex asynchronously to not block app startup
        setImmediate(() => {
          this.reindexAll().catch((error) => {
            this.logger.error('Auto-reindex failed', error)
          })
        })
      } else if (stats.totalDocuments > 0) {
        this.logger.log(`Vendor index initialized with ${stats.totalDocuments} documents`)
      } else {
        this.logger.log('No vendors found in database to index')
      }
    } catch (error) {
      this.logger.error('Failed to check index status', error)
    }
  }

  private async ensureIndexExists(): Promise<void> {
    const config: IndexConfig = {
      primaryKey: 'id',
      searchableAttributes: [
        'businessName',
        'tagline',
        'description',
        'categoryName',
        'services',
        'tags',
        'serviceAreas',
        'city',
        'state',
        'country',
      ],
      filterableAttributes: [
        'categoryId',
        'categorySlug',
        'status',
        'verificationStatus',
        'city',
        'state',
        'country',
        'isVerified',
        'serviceAreas',
        'minPrice',
        'maxPrice',
        'leadCount',
        'viewCount',
      ],
      sortableAttributes: [
        'createdAt',
        'viewCount',
        'leadCount',
        'minPrice',
      ],
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
      ],
      distinctAttribute: 'id',
    }

    const exists = await this.search.indexExists(VENDOR_INDEX_NAME)

    if (!exists) {
      await this.search.createIndex(VENDOR_INDEX_NAME, config)
      this.logger.log('Vendors search index created')
    } else {
      // Always update settings to ensure they're in sync
      await this.search.updateIndexSettings(VENDOR_INDEX_NAME, config)
      this.logger.log('Vendors search index settings updated')
    }
  }

  // ============================================================================
  // INDEXING OPERATIONS
  // ============================================================================

  async indexVendor(vendorId: string): Promise<void> {
    const vendor = await this.fetchVendorData(vendorId)

    if (!vendor) {
      this.logger.warn(`Vendor not found for indexing: ${vendorId}`)
      return
    }

    const document = this.transformToSearchDocument(vendor)
    await this.search.addDocumentsAndWait(VENDOR_INDEX_NAME, [document])

    this.logger.debug(`Vendor indexed: ${vendorId}`)
  }

  async indexVendors(vendorIds: string[]): Promise<void> {
    const vendors = await this.fetchVendorsData(vendorIds)
    const documents = vendors.map((v) => this.transformToSearchDocument(v))

    if (documents.length > 0) {
      await this.search.addDocumentsAndWait(VENDOR_INDEX_NAME, documents)
      this.logger.debug(`Indexed ${documents.length} vendors`)
    }
  }

  async updateVendorIndex(vendorId: string): Promise<void> {
    await this.indexVendor(vendorId)
  }

  async removeFromIndex(vendorId: string): Promise<void> {
    await this.search.deleteDocument(VENDOR_INDEX_NAME, vendorId)
    this.logger.debug(`Vendor removed from index: ${vendorId}`)
  }

  async removeMultipleFromIndex(vendorIds: string[]): Promise<void> {
    await this.search.deleteDocuments(VENDOR_INDEX_NAME, vendorIds)
    this.logger.debug(`Removed ${vendorIds.length} vendors from index`)
  }

  // ============================================================================
  // FULL REINDEX
  // ============================================================================

  async reindexAll(batchSize: number = 100): Promise<void> {
    this.logger.log('Starting full vendor reindex...')

    // Clear existing index
    await this.search.deleteAllDocuments(VENDOR_INDEX_NAME)

    // Get total count
    const totalCount = await this.prisma.vendorProfile.count({})

    let processed = 0

    while (processed < totalCount) {
      const vendors = await this.prisma.vendorProfile.findMany({
        skip: processed,
        take: batchSize,
        include: {
          category: true,
          address: { include: { city: { include: { state: { include: { country: true } } } } } },
          serviceAreas: true,
          services: { where: { isActive: true }, include: { serviceType: true } },
          tags: { include: { tag: true } },
        },
      })

      const documents = vendors.map((v) => this.transformToSearchDocument(v))

      if (documents.length > 0) {
        await this.search.addDocumentsAndWait(VENDOR_INDEX_NAME, documents)
      }

      processed += vendors.length
      this.logger.log(`Reindex progress: ${processed}/${totalCount}`)
    }

    this.logger.log(`Full vendor reindex completed: ${totalCount} vendors`)
  }

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================

  @OnEvent('vendor.created')
  async handleVendorCreated(payload: { vendorId: string }): Promise<void> {
    await this.indexVendor(payload.vendorId)
  }

  @OnEvent('vendor.updated')
  async handleVendorUpdated(payload: { vendorId: string }): Promise<void> {
    await this.updateVendorIndex(payload.vendorId)
  }

  @OnEvent('vendor.deleted')
  async handleVendorDeleted(payload: { vendorId: string }): Promise<void> {
    await this.removeFromIndex(payload.vendorId)
  }

  @OnEvent('vendor.verified')
  async handleVendorVerified(payload: { vendorId: string }): Promise<void> {
    await this.updateVendorIndex(payload.vendorId)
  }

  @OnEvent('vendor.review.added')
  async handleReviewAdded(payload: { vendorId: string }): Promise<void> {
    await this.updateVendorIndex(payload.vendorId)
  }

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  private async fetchVendorData(vendorId: string): Promise<unknown> {
    return this.prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      include: {
        category: true,
        address: { include: { city: { include: { state: { include: { country: true } } } } } },
        serviceAreas: true,
        services: { where: { isActive: true }, include: { serviceType: true } },
        tags: { include: { tag: true } },
      },
    })
  }

  private async fetchVendorsData(vendorIds: string[]): Promise<unknown[]> {
    return this.prisma.vendorProfile.findMany({
      where: { id: { in: vendorIds } },
      include: {
        category: true,
        address: { include: { city: { include: { state: { include: { country: true } } } } } },
        serviceAreas: true,
        services: { where: { isActive: true }, include: { serviceType: true } },
        tags: { include: { tag: true } },
      },
    })
  }

  // ============================================================================
  // DATA TRANSFORMATION
  // ============================================================================

  private transformToSearchDocument(vendor: any): VendorSearchDocument {
    const servicePrices = (vendor.services || [])
      .flatMap((service: any) => [service.startingPrice, service.maxPrice])
      .filter((price: any) => price !== null && price !== undefined)
      .map((price: any) => Number(price))
      .filter((price: number) => !Number.isNaN(price))

    const minPrice = servicePrices.length > 0 ? Math.min(...servicePrices) : undefined
    const maxPrice = servicePrices.length > 0 ? Math.max(...servicePrices) : undefined

    const latitude = vendor.address?.latitude ? Number(vendor.address.latitude) : undefined
    const longitude = vendor.address?.longitude ? Number(vendor.address.longitude) : undefined

    const document: VendorSearchDocument = {
      id: vendor.id,
      businessName: vendor.businessName,
      slug: vendor.slug,
      tagline: vendor.tagline || undefined,
      description: vendor.description || '',
      categoryId: vendor.categoryId,
      categoryName: vendor.category?.name || '',
      categorySlug: vendor.category?.slug || '',
      status: vendor.status,
      verificationStatus: vendor.verifiedAt ? 'VERIFIED' : 'UNVERIFIED',
      city: vendor.address?.city?.name,
      state: vendor.address?.city?.state?.name,
      country: vendor.address?.city?.state?.country?.name,
      isVerified: !!vendor.verifiedAt,
      leadCount: vendor.leadCount || 0,
      viewCount: vendor.viewCount || 0,
      minPrice,
      maxPrice,
      services: vendor.services?.map((s: any) => s.serviceType?.name).filter(Boolean) || [],
      tags: vendor.tags?.map((t: any) => t.tag?.name).filter(Boolean) || [],
      serviceAreas: vendor.serviceAreas?.map((sa: any) => sa.cityId).filter(Boolean) || [],
      _geo:
        latitude !== undefined && longitude !== undefined
          ? { lat: latitude, lng: longitude }
          : undefined,
      createdAt: new Date(vendor.createdAt).getTime(),
      updatedAt: new Date(vendor.updatedAt).getTime(),
    }

    return document
  }

  // ============================================================================
  // SEARCH HELPERS
  // ============================================================================

  async searchVendors(
    query: string,
    options?: {
      page?: number
      hitsPerPage?: number
      categoryId?: string
      city?: string
      country?: string
      priceMin?: number
      priceMax?: number
      isVerified?: boolean
      serviceAreaCityId?: string
      sortBy?: 'createdAt' | 'viewCount' | 'leadCount' | 'minPrice'
      sortOrder?: 'asc' | 'desc'
    },
  ) {
    const filters: string[] = ['status = "ACTIVE"']

    if (options?.categoryId) {
      filters.push(`categoryId = "${options.categoryId}"`)
    }

    if (options?.city) {
      filters.push(`city = "${options.city}"`)
    }

    if (options?.country) {
      filters.push(`country = "${options.country}"`)
    }

    if (options?.priceMin !== undefined) {
      filters.push(`minPrice >= ${options.priceMin}`)
    }

    if (options?.priceMax !== undefined) {
      filters.push(`maxPrice <= ${options.priceMax}`)
    }

    if (options?.isVerified !== undefined) {
      filters.push(`isVerified = ${options.isVerified}`)
    }

    if (options?.serviceAreaCityId) {
      filters.push(`serviceAreas = "${options.serviceAreaCityId}"`)
    }

    const sortField = {
      createdAt: 'createdAt',
      viewCount: 'viewCount',
      leadCount: 'leadCount',
      minPrice: 'minPrice',
    }[options?.sortBy || 'createdAt']

    const sortOrder = options?.sortOrder || 'desc'

    return this.search.searchWithFilters<VendorSearchDocument>(
      VENDOR_INDEX_NAME,
      query,
      filters,
      {
        page: options?.page,
        hitsPerPage: options?.hitsPerPage,
        sort: [`${sortField}:${sortOrder}`],
      },
    )
  }

  async searchNearbyVendors(
    query: string,
    lat: number,
    lng: number,
    radiusInMeters: number = 50000, // 50km default
    options?: {
      page?: number
      hitsPerPage?: number
      categoryId?: string
    },
  ) {
    const filters: string[] = ['status = "ACTIVE"']

    if (options?.categoryId) {
      filters.push(`categoryId = "${options.categoryId}"`)
    }

    return this.search.searchGeo<VendorSearchDocument>(
      VENDOR_INDEX_NAME,
      query,
      { lat, lng, radiusInMeters },
      {
        page: options?.page,
        hitsPerPage: options?.hitsPerPage,
        filter: filters.join(' AND '),
      },
    )
  }

  async getVendorSuggestions(query: string, limit: number = 5): Promise<string[]> {
    const result = await this.search.search<VendorSearchDocument>(
      VENDOR_INDEX_NAME,
      query,
      {
        hitsPerPage: limit,
        attributesToRetrieve: ['businessName'],
      },
    )

    return result.hits
      .map((hit) => hit.businessName)
      .filter((name) => name && name.length > 0)
  }

  async getIndexStats(): Promise<{
    totalDocuments: number
    isIndexing: boolean
  }> {
    const index = this.search.getIndex(VENDOR_INDEX_NAME)
    const stats = await index.getStats()
    return {
      totalDocuments: stats.numberOfDocuments || 0,
      isIndexing: stats.isIndexing || false,
    }
  }
}
