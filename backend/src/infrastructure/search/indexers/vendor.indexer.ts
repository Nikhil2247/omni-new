// ============================================================================
// VENDOR INDEXER - Search Index for Vendors
// ============================================================================
// Manages indexing of vendors for full-text search with Meilisearch
// Supports geo-search, filtering by category, rating, service type, etc.
// ============================================================================

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MeilisearchService, IndexConfig } from '../meilisearch.service';
import { PrismaService } from '../../../core/database/prisma.service';

export const VENDOR_INDEX_NAME = 'vendors';

export interface VendorSearchDocument extends Record<string, unknown> {
  id: string;
  businessName: string;
  slug: string;
  tagline?: string;
  description: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  status: string;
  verificationStatus: string;
  city?: string;
  state?: string;
  country?: string;
  isVerified: boolean;
  leadCount: number;
  viewCount: number;
  minPrice?: number;
  maxPrice?: number;
  services?: string[];
  tags?: string[];
  serviceAreas?: string[];
  _geo?: { lat: number; lng: number };
  createdAt: number;
  updatedAt: number;

  // Subscription & Visibility
  planTier: string; // FREE, STARTER, PROFESSIONAL, ENTERPRISE
  searchBoost: number; // 0-100
  hasPremiumBadge: boolean; // true if ENTERPRISE
  hasProBadge: boolean; // true if PROFESSIONAL or ENTERPRISE
  isProfileBoosted: boolean; // true if active PROFILE_BOOST campaign exists
  isFeatured: boolean; // true if PROFESSIONAL or ENTERPRISE
}

@Injectable()
export class VendorIndexer implements OnModuleInit {
  private readonly logger = new Logger(VendorIndexer.name);

  constructor(
    private readonly search: MeilisearchService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureIndexExists();

    // Check if index is empty and there are vendors in DB
    try {
      const stats = await this.getIndexStats();
      const vendorCount = await this.prisma.vendorProfile.count({});

      if (stats.totalDocuments === 0 && vendorCount > 0) {
        this.logger.warn(
          `Vendor index is empty but ${vendorCount} vendors exist in database. Triggering automatic reindex...`,
        );
        // Trigger reindex asynchronously to not block app startup
        setImmediate(() => {
          this.reindexAll().catch((error) => {
            this.logger.error('Auto-reindex failed', error);
          });
        });
      } else if (stats.totalDocuments > 0) {
        this.logger.log(
          `Vendor index initialized with ${stats.totalDocuments} documents`,
        );
      } else {
        this.logger.log('No vendors found in database to index');
      }
    } catch (error) {
      this.logger.error('Failed to check index status', error);
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
        // Subscription & Visibility filters
        'planTier',
        'hasPremiumBadge',
        'hasProBadge',
        'isProfileBoosted',
        'isFeatured',
      ],
      sortableAttributes: [
        'createdAt',
        'viewCount',
        'leadCount',
        'minPrice',
        'searchBoost', // Sort by search boost for premium placement
      ],
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
        'searchBoost:desc', // Higher search boost = higher ranking
      ],
      distinctAttribute: 'id',
    };

    const exists = await this.search.indexExists(VENDOR_INDEX_NAME);

    if (!exists) {
      await this.search.createIndex(VENDOR_INDEX_NAME, config);
      this.logger.log('Vendors search index created');
    } else {
      // Always update settings to ensure they're in sync
      await this.search.updateIndexSettings(VENDOR_INDEX_NAME, config);
      this.logger.log('Vendors search index settings updated');
    }
  }

  // ============================================================================
  // INDEXING OPERATIONS
  // ============================================================================

  async indexVendor(vendorId: string): Promise<void> {
    const result = await this.fetchVendorData(vendorId);

    if (!result) {
      this.logger.warn(`Vendor not found for indexing: ${vendorId}`);
      return;
    }

    const document = this.transformToSearchDocument(
      result.vendor,
      result.isProfileBoosted,
    );
    await this.search.addDocumentsAndWait(VENDOR_INDEX_NAME, [document]);

    this.logger.debug(`Vendor indexed: ${vendorId}`);
  }

  async indexVendors(vendorIds: string[]): Promise<void> {
    const vendorsData = await this.fetchVendorsData(vendorIds);
    const documents = vendorsData.map((v) =>
      this.transformToSearchDocument(v.vendor, v.isProfileBoosted),
    );

    if (documents.length > 0) {
      await this.search.addDocumentsAndWait(VENDOR_INDEX_NAME, documents);
      this.logger.debug(`Indexed ${documents.length} vendors`);
    }
  }

  async updateVendorIndex(vendorId: string): Promise<void> {
    await this.indexVendor(vendorId);
  }

  async removeFromIndex(vendorId: string): Promise<void> {
    await this.search.deleteDocument(VENDOR_INDEX_NAME, vendorId);
    this.logger.debug(`Vendor removed from index: ${vendorId}`);
  }

  async removeMultipleFromIndex(vendorIds: string[]): Promise<void> {
    await this.search.deleteDocuments(VENDOR_INDEX_NAME, vendorIds);
    this.logger.debug(`Removed ${vendorIds.length} vendors from index`);
  }

  // ============================================================================
  // FULL REINDEX
  // ============================================================================

  async reindexAll(batchSize: number = 100): Promise<void> {
    this.logger.log('Starting full vendor reindex...');

    // Clear existing index
    await this.search.deleteAllDocuments(VENDOR_INDEX_NAME);

    // Get total count
    const totalCount = await this.prisma.vendorProfile.count({});

    let processed = 0;

    while (processed < totalCount) {
      const vendors = await this.prisma.vendorProfile.findMany({
        skip: processed,
        take: batchSize,
        include: {
          category: true,
          address: {
            include: {
              city: { include: { state: { include: { country: true } } } },
            },
          },
          serviceAreas: true,
          services: {
            where: { isActive: true },
            include: { serviceType: true },
          },
          tags: { include: { tag: true } },
        },
      });

      // Fetch active profile boosts for this batch
      const vendorIds = vendors.map((v) => v.id);
      const boostedVendors = await this.fetchActiveProfileBoosts(vendorIds);

      const documents = vendors.map((v) =>
        this.transformToSearchDocument(v, boostedVendors.has(v.id)),
      );

      if (documents.length > 0) {
        await this.search.addDocumentsAndWait(VENDOR_INDEX_NAME, documents);
      }

      processed += vendors.length;
      this.logger.log(`Reindex progress: ${processed}/${totalCount}`);
    }

    this.logger.log(`Full vendor reindex completed: ${totalCount} vendors`);
  }

  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================

  @OnEvent('vendor.created')
  async handleVendorCreated(payload: { vendorId: string }): Promise<void> {
    await this.indexVendor(payload.vendorId);
  }

  @OnEvent('vendor.updated')
  async handleVendorUpdated(payload: { vendorId: string }): Promise<void> {
    await this.updateVendorIndex(payload.vendorId);
  }

  @OnEvent('vendor.deleted')
  async handleVendorDeleted(payload: { vendorId: string }): Promise<void> {
    await this.removeFromIndex(payload.vendorId);
  }

  @OnEvent('vendor.verified')
  async handleVendorVerified(payload: { vendorId: string }): Promise<void> {
    await this.updateVendorIndex(payload.vendorId);
  }

  @OnEvent('vendor.review.added')
  async handleReviewAdded(payload: { vendorId: string }): Promise<void> {
    await this.updateVendorIndex(payload.vendorId);
  }

  @OnEvent('vendor.subscription.updated')
  async handleSubscriptionUpdated(payload: {
    vendorId: string;
  }): Promise<void> {
    this.logger.debug(`Vendor subscription updated: ${payload.vendorId}`);
    await this.updateVendorIndex(payload.vendorId);
  }

  @OnEvent('campaign.status.changed')
  async handleCampaignStatusChanged(payload: {
    vendorProfileId: string;
    campaignType: string;
  }): Promise<void> {
    // Only reindex if it's a PROFILE_BOOST campaign (affects search visibility)
    if (payload.campaignType === 'PROFILE_BOOST') {
      this.logger.debug(
        `Campaign status changed for vendor: ${payload.vendorProfileId}`,
      );
      await this.updateVendorIndex(payload.vendorProfileId);
    }
  }

  @OnEvent('campaign.created')
  async handleCampaignCreated(payload: {
    vendorProfileId: string;
    campaignType: string;
  }): Promise<void> {
    if (payload.campaignType === 'PROFILE_BOOST') {
      await this.updateVendorIndex(payload.vendorProfileId);
    }
  }

  // ============================================================================
  // PROFILE BOOST HELPER
  // ============================================================================

  /**
   * Check if vendor has an active PROFILE_BOOST campaign
   * @param vendorProfileId - The vendor profile ID to check
   * @returns true if vendor has an active PROFILE_BOOST campaign
   */
  async isProfileBoosted(vendorProfileId: string): Promise<boolean> {
    const now = new Date();
    // Query campaigns table directly to check for active PROFILE_BOOST
    const activeBoostCampaign = await (this.prisma as any).campaign?.findFirst({
      where: {
        vendorProfileId,
        type: 'PROFILE_BOOST',
        status: 'ACTIVE',
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
    });

    return activeBoostCampaign !== null;
  }

  /**
   * Fetch active PROFILE_BOOST campaigns for a list of vendor profile IDs
   * @private
   */
  private async fetchActiveProfileBoosts(
    vendorProfileIds: string[],
  ): Promise<Set<string>> {
    const now = new Date();
    try {
      // Query campaigns table directly (with type assertion for pre-generated client compatibility)
      const campaigns = await (this.prisma as any).campaign?.findMany({
        where: {
          vendorProfileId: { in: vendorProfileIds },
          type: 'PROFILE_BOOST',
          status: 'ACTIVE',
          startDate: { lte: now },
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        },
        select: { vendorProfileId: true },
      });

      return new Set(
        (campaigns || []).map((c: { vendorProfileId: string }) => c.vendorProfileId),
      );
    } catch {
      // If campaign table doesn't exist yet, return empty set
      this.logger.debug(
        'Campaign table not available, skipping profile boost check',
      );
      return new Set();
    }
  }

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  private async fetchVendorData(
    vendorId: string,
  ): Promise<{ vendor: unknown; isProfileBoosted: boolean } | null> {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      include: {
        category: true,
        address: {
          include: {
            city: { include: { state: { include: { country: true } } } },
          },
        },
        serviceAreas: true,
        services: { where: { isActive: true }, include: { serviceType: true } },
        tags: { include: { tag: true } },
      },
    });

    if (!vendor) return null;

    // Check for active PROFILE_BOOST campaign separately
    const boostedVendors = await this.fetchActiveProfileBoosts([vendorId]);

    return {
      vendor,
      isProfileBoosted: boostedVendors.has(vendorId),
    };
  }

  private async fetchVendorsData(
    vendorIds: string[],
  ): Promise<Array<{ vendor: unknown; isProfileBoosted: boolean }>> {
    const vendors = await this.prisma.vendorProfile.findMany({
      where: { id: { in: vendorIds } },
      include: {
        category: true,
        address: {
          include: {
            city: { include: { state: { include: { country: true } } } },
          },
        },
        serviceAreas: true,
        services: { where: { isActive: true }, include: { serviceType: true } },
        tags: { include: { tag: true } },
      },
    });

    // Fetch active profile boosts for all vendors
    const boostedVendors = await this.fetchActiveProfileBoosts(vendorIds);

    return vendors.map((vendor) => ({
      vendor,
      isProfileBoosted: boostedVendors.has(vendor.id),
    }));
  }

  // ============================================================================
  // DATA TRANSFORMATION
  // ============================================================================

  private transformToSearchDocument(
    vendor: any,
    isProfileBoosted: boolean = false,
  ): VendorSearchDocument {
    const servicePrices = (vendor.services || [])
      .flatMap((service: any) => [service.startingPrice, service.maxPrice])
      .filter((price: any) => price !== null && price !== undefined)
      .map((price: any) => Number(price))
      .filter((price: number) => !Number.isNaN(price));

    const minPrice =
      servicePrices.length > 0 ? Math.min(...servicePrices) : undefined;
    const maxPrice =
      servicePrices.length > 0 ? Math.max(...servicePrices) : undefined;

    const latitude = vendor.address?.latitude
      ? Number(vendor.address.latitude)
      : undefined;
    const longitude = vendor.address?.longitude
      ? Number(vendor.address.longitude)
      : undefined;

    // Subscription & Visibility calculations
    const planTier: string = vendor.planTier || 'FREE';
    const searchBoost: number = vendor.searchBoost ?? 0;
    const hasPremiumBadge = planTier === 'ENTERPRISE';
    const hasProBadge = ['PROFESSIONAL', 'ENTERPRISE'].includes(planTier);
    const isFeatured = ['PROFESSIONAL', 'ENTERPRISE'].includes(planTier);

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
      services:
        vendor.services?.map((s: any) => s.serviceType?.name).filter(Boolean) ||
        [],
      tags: vendor.tags?.map((t: any) => t.tag?.name).filter(Boolean) || [],
      serviceAreas:
        vendor.serviceAreas?.map((sa: any) => sa.cityId).filter(Boolean) || [],
      _geo:
        latitude !== undefined && longitude !== undefined
          ? { lat: latitude, lng: longitude }
          : undefined,
      createdAt: new Date(vendor.createdAt).getTime(),
      updatedAt: new Date(vendor.updatedAt).getTime(),

      // Subscription & Visibility
      planTier,
      searchBoost,
      hasPremiumBadge,
      hasProBadge,
      isProfileBoosted,
      isFeatured,
    };

    return document;
  }

  // ============================================================================
  // SEARCH HELPERS
  // ============================================================================

  async searchVendors(
    query: string,
    options?: {
      page?: number;
      hitsPerPage?: number;
      categoryId?: string;
      city?: string;
      country?: string;
      priceMin?: number;
      priceMax?: number;
      isVerified?: boolean;
      serviceAreaCityId?: string;
      // Subscription & Visibility filters
      planTier?: string | string[]; // Filter by plan tier(s)
      hasProBadge?: boolean; // Filter to PRO+ vendors only
      hasPremiumBadge?: boolean; // Filter to ENTERPRISE vendors only
      isFeatured?: boolean; // Filter to featured vendors
      isProfileBoosted?: boolean; // Filter to boosted profiles
      sortBy?:
        | 'createdAt'
        | 'viewCount'
        | 'leadCount'
        | 'minPrice'
        | 'searchBoost';
      sortOrder?: 'asc' | 'desc';
    },
  ) {
    const filters: string[] = ['(status = "ACTIVE" OR status = "UNCLAIMED")'];

    if (options?.categoryId) {
      filters.push(`categoryId = "${options.categoryId}"`);
    }

    if (options?.city) {
      filters.push(`city = "${options.city}"`);
    }

    if (options?.country) {
      filters.push(`country = "${options.country}"`);
    }

    if (options?.priceMin !== undefined) {
      filters.push(`minPrice >= ${options.priceMin}`);
    }

    if (options?.priceMax !== undefined) {
      filters.push(`maxPrice <= ${options.priceMax}`);
    }

    if (options?.isVerified !== undefined) {
      filters.push(`isVerified = ${options.isVerified}`);
    }

    if (options?.serviceAreaCityId) {
      filters.push(`serviceAreas = "${options.serviceAreaCityId}"`);
    }

    // Subscription & Visibility filters
    if (options?.planTier) {
      if (Array.isArray(options.planTier)) {
        const tierFilters = options.planTier
          .map((tier) => `planTier = "${tier}"`)
          .join(' OR ');
        filters.push(`(${tierFilters})`);
      } else {
        filters.push(`planTier = "${options.planTier}"`);
      }
    }

    if (options?.hasProBadge !== undefined) {
      filters.push(`hasProBadge = ${options.hasProBadge}`);
    }

    if (options?.hasPremiumBadge !== undefined) {
      filters.push(`hasPremiumBadge = ${options.hasPremiumBadge}`);
    }

    if (options?.isFeatured !== undefined) {
      filters.push(`isFeatured = ${options.isFeatured}`);
    }

    if (options?.isProfileBoosted !== undefined) {
      filters.push(`isProfileBoosted = ${options.isProfileBoosted}`);
    }

    const sortField = {
      createdAt: 'createdAt',
      viewCount: 'viewCount',
      leadCount: 'leadCount',
      minPrice: 'minPrice',
      searchBoost: 'searchBoost',
    }[options?.sortBy || 'createdAt'];

    const sortOrder = options?.sortOrder || 'desc';

    return this.search.searchWithFilters<VendorSearchDocument>(
      VENDOR_INDEX_NAME,
      query,
      filters,
      {
        page: options?.page,
        hitsPerPage: options?.hitsPerPage,
        sort: [`${sortField}:${sortOrder}`],
      },
    );
  }

  async searchNearbyVendors(
    query: string,
    lat: number,
    lng: number,
    radiusInMeters: number = 50000, // 50km default
    options?: {
      page?: number;
      hitsPerPage?: number;
      categoryId?: string;
    },
  ) {
    const filters: string[] = ['(status = "ACTIVE" OR status = "UNCLAIMED")'];

    if (options?.categoryId) {
      filters.push(`categoryId = "${options.categoryId}"`);
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
    );
  }

  async getVendorSuggestions(
    query: string,
    limit: number = 5,
  ): Promise<string[]> {
    const result = await this.search.search<VendorSearchDocument>(
      VENDOR_INDEX_NAME,
      query,
      {
        hitsPerPage: limit,
        attributesToRetrieve: ['businessName'],
      },
    );

    return result.hits
      .map((hit) => hit.businessName)
      .filter((name) => name && name.length > 0);
  }

  async getIndexStats(): Promise<{
    totalDocuments: number;
    isIndexing: boolean;
  }> {
    const index = this.search.getIndex(VENDOR_INDEX_NAME);
    const stats = await index.getStats();
    return {
      totalDocuments: stats.numberOfDocuments || 0,
      isIndexing: stats.isIndexing || false,
    };
  }
}
