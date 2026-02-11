// ============================================================================
// SEARCH INDEX HANDLER - Meilisearch Indexing
// ============================================================================
// Handles search index updates based on domain events
// ============================================================================

import { Injectable, Logger, Inject, Optional } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import {
  VENDOR_EVENTS,
  CATEGORY_EVENTS,
  SEARCH_EVENTS,
  SearchIndexPayload,
} from '../event-constants'
import { PrismaService } from '../../database/prisma.service'

interface MeilisearchClient {
  index(indexName: string): {
    addDocuments(documents: any[]): Promise<any>
    updateDocuments(documents: any[]): Promise<any>
    deleteDocument(id: string): Promise<any>
    deleteAllDocuments(): Promise<any>
  }
}

@Injectable()
export class SearchIndexHandler {
  private readonly logger = new Logger(SearchIndexHandler.name)

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject('MEILISEARCH_CLIENT') private readonly meilisearch?: MeilisearchClient,
  ) {}

  // Vendor indexing
  @OnEvent(VENDOR_EVENTS.CREATED)
  @OnEvent(VENDOR_EVENTS.UPDATED)
  @OnEvent(VENDOR_EVENTS.PUBLISHED)
  async handleVendorIndex(payload: { vendorProfileId: string }) {
    if (!this.meilisearch) {
      this.logger.debug('Meilisearch not configured, skipping indexing')
      return
    }

    try {
      const vendor = await this.getVendorForIndexing(payload.vendorProfileId)

      if (!vendor) {
        this.logger.warn(`Vendor not found for indexing: ${payload.vendorProfileId}`)
        return
      }

      // Only index active vendors
      if (vendor.status !== 'ACTIVE') {
        await this.removeVendorFromIndex(payload.vendorProfileId)
        return
      }

      const document = this.mapVendorToSearchDocument(vendor)
      await this.meilisearch.index('vendors').addDocuments([document])

      this.logger.debug(`Indexed vendor: ${payload.vendorProfileId}`)
    } catch (error) {
      this.logger.error(`Failed to index vendor ${payload.vendorProfileId}:`, error)
    }
  }

  @OnEvent(VENDOR_EVENTS.DELETED)
  @OnEvent(VENDOR_EVENTS.UNPUBLISHED)
  @OnEvent(VENDOR_EVENTS.SUSPENDED)
  async handleVendorRemove(payload: { vendorProfileId: string }) {
    await this.removeVendorFromIndex(payload.vendorProfileId)
  }

  // Category indexing
  @OnEvent(CATEGORY_EVENTS.CREATED)
  @OnEvent(CATEGORY_EVENTS.UPDATED)
  async handleCategoryIndex(payload: { categoryId: string }) {
    if (!this.meilisearch) return

    try {
      const category = await this.prisma.category.findUnique({
        where: { id: payload.categoryId },
        include: {
          parent: { select: { name: true, slug: true } },
        },
      })

      if (!category || !category.isActive) {
        await this.meilisearch.index('categories').deleteDocument(payload.categoryId)
        return
      }

      const document = {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        parentName: category.parent?.name,
        parentSlug: category.parent?.slug,
        iconUrl: category.icon,
      }

      await this.meilisearch.index('categories').addDocuments([document])
      this.logger.debug(`Indexed category: ${payload.categoryId}`)
    } catch (error) {
      this.logger.error(`Failed to index category ${payload.categoryId}:`, error)
    }
  }

  @OnEvent(CATEGORY_EVENTS.DELETED)
  async handleCategoryRemove(payload: { categoryId: string }) {
    if (!this.meilisearch) return

    try {
      await this.meilisearch.index('categories').deleteDocument(payload.categoryId)
      this.logger.debug(`Removed category from index: ${payload.categoryId}`)
    } catch (error) {
      this.logger.error(`Failed to remove category from index ${payload.categoryId}:`, error)
    }
  }

  // Generic search index handler
  @OnEvent(SEARCH_EVENTS.INDEX_VENDOR)
  async handleSearchIndexVendor(payload: SearchIndexPayload) {
    if (payload.action === 'remove') {
      await this.removeVendorFromIndex(payload.entityId)
    } else {
      await this.handleVendorIndex({ vendorProfileId: payload.entityId })
    }
  }

  @OnEvent(SEARCH_EVENTS.REMOVE_VENDOR)
  async handleSearchRemoveVendor(payload: { vendorProfileId: string }) {
    await this.removeVendorFromIndex(payload.vendorProfileId)
  }

  @OnEvent(SEARCH_EVENTS.REINDEX_ALL)
  async handleReindexAll(payload: { entityType: 'vendor' | 'category' }) {
    this.logger.log(`Reindexing all ${payload.entityType}s...`)

    if (!this.meilisearch) {
      this.logger.warn('Meilisearch not configured')
      return
    }

    try {
      if (payload.entityType === 'vendor') {
        await this.reindexAllVendors()
      } else if (payload.entityType === 'category') {
        await this.reindexAllCategories()
      }
    } catch (error) {
      this.logger.error(`Failed to reindex ${payload.entityType}s:`, error)
    }
  }

  private async removeVendorFromIndex(vendorProfileId: string): Promise<void> {
    if (!this.meilisearch) return

    try {
      await this.meilisearch.index('vendors').deleteDocument(vendorProfileId)
      this.logger.debug(`Removed vendor from index: ${vendorProfileId}`)
    } catch (error) {
      this.logger.error(`Failed to remove vendor from index ${vendorProfileId}:`, error)
    }
  }

  private async getVendorForIndexing(vendorProfileId: string) {
    return this.prisma.vendorProfile.findUnique({
      where: { id: vendorProfileId },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        address: {
          include: {
            city: { include: { state: { include: { country: true } } } },
          },
        },
        services: {
          where: { isActive: true },
          include: { serviceType: true },
        },
        tags: { include: { tag: true } },
      },
    })
  }

  private mapVendorToSearchDocument(vendor: any) {
    return {
      id: vendor.id,
      businessName: vendor.businessName,
      slug: vendor.slug,
      tagline: vendor.tagline,
      description: vendor.description,
      categoryId: vendor.categoryId,
      categoryName: vendor.category?.name,
      categorySlug: vendor.category?.slug,
      city: vendor.address?.city?.name,
      state: vendor.address?.city?.state?.name,
      country: vendor.address?.city?.state?.country?.name,
      avgRating: vendor.avgRating,
      reviewCount: vendor.reviewCount,
      priceRange: vendor.priceRange,
      services: vendor.services?.map((s: any) => s.serviceType?.name).filter(Boolean),
      tags: vendor.tags?.map((t: any) => t.tag?.name).filter(Boolean),
      featuredImageUrl: vendor.featuredImageUrl,
      isVerified: vendor.isVerified,
      isFeatured: vendor.isFeatured,
      createdAt: vendor.createdAt?.getTime(),
    }
  }

  private async reindexAllVendors(): Promise<void> {
    // Clear existing index
    await this.meilisearch!.index('vendors').deleteAllDocuments()

    // Fetch and index in batches
    const batchSize = 100
    let skip = 0
    let hasMore = true

    while (hasMore) {
      const vendors = await this.prisma.vendorProfile.findMany({
        where: { status: 'ACTIVE' as any },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          address: {
            include: {
              city: { include: { state: { include: { country: true } } } },
            },
          },
          services: {
            where: { isActive: true },
            include: { serviceType: true },
          },
          tags: { include: { tag: true } },
        },
        skip,
        take: batchSize,
      })

      if (vendors.length === 0) {
        hasMore = false
        break
      }

      const documents = vendors.map((v) => this.mapVendorToSearchDocument(v))
      await this.meilisearch!.index('vendors').addDocuments(documents)

      this.logger.debug(`Indexed ${skip + vendors.length} vendors`)
      skip += batchSize
    }

    this.logger.log('Vendor reindexing complete')
  }

  private async reindexAllCategories(): Promise<void> {
    await this.meilisearch!.index('categories').deleteAllDocuments()

    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        parent: { select: { name: true, slug: true } },
      },
    })

    const documents = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      parentName: c.parent?.name,
      parentSlug: c.parent?.slug,
      iconUrl: c.icon,
    }))

    await this.meilisearch!.index('categories').addDocuments(documents)
    this.logger.log(`Indexed ${categories.length} categories`)
  }
}
