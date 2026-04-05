// ============================================================================
// CAMPAIGN DISPLAY SERVICE - Show campaigns on public pages
// ============================================================================
// Service to fetch and display active campaigns on public-facing pages
// Handles profile boosts, featured listings, banner ads, and promotions
// Real-time credit spending and weighted random ad selection
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { CampaignStatus, CampaignType, CreditTransactionType } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Cost configuration
const COST_CONFIG = {
  IMPRESSIONS_PER_CREDIT: 50,  // 50 impressions = 1 credit
  CLICK: 1,                     // 1 credit per click
  CONVERSION: 0,                // Conversions don't cost extra
};

export interface BoostedVendor {
  vendorProfileId: string;
  campaignId: string;
  boostScore: number; // Higher = more priority
}

export interface FeaturedListing {
  vendorProfileId: string;
  campaignId: string;
  businessName: string;
  slug: string;
  categoryId: string;
  profilePhotoUrl?: string;
  tagline?: string;
  averageRating?: number;
  totalReviews: number;
}

export interface BannerAd {
  campaignId: string;
  vendorProfileId: string;
  targetEntityId?: string;
  targetEntityType?: string;
  businessName: string;
  slug: string;
  bannerImageUrl?: string;
  tagline?: string;
}

export interface PromotedAlbum {
  campaignId: string;
  vendorProfileId: string;
  portfolioId: string;
  title: string;
  coverImageUrl?: string;
  businessName: string;
  vendorSlug: string;
}

@Injectable()
export class CampaignDisplayService {
  private readonly logger = new Logger(CampaignDisplayService.name);

  // In-memory cache for fast lookups (refreshed every 5 minutes)
  private boostedVendorIds: Set<string> = new Set();
  private featuredVendorIds: Set<string> = new Set();
  private lastCacheRefresh: Date = new Date(0);
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Initial cache load
    this.refreshCache();
  }

  // ============================================================================
  // Weighted Random Selection Helper
  // ============================================================================

  /**
   * Select items using weighted random selection based on dailyBudget
   * Higher budget = higher chance of being selected, but not guaranteed
   * This ensures fair distribution across all campaigns
   */
  private weightedRandomSelect<T extends { dailyBudget: number; id: string; creditsSpent: number; totalBudget: number }>(
    items: T[],
    limit: number,
  ): T[] {
    // Filter out campaigns that have exhausted their budget
    const eligibleItems = items.filter(item => item.creditsSpent < item.totalBudget);

    if (eligibleItems.length === 0) return [];
    if (eligibleItems.length <= limit) return eligibleItems;

    const selected: T[] = [];
    const remaining = [...eligibleItems];

    while (selected.length < limit && remaining.length > 0) {
      // Calculate total weight
      const totalWeight = remaining.reduce((sum, item) => sum + item.dailyBudget, 0);

      if (totalWeight === 0) {
        // If all have zero budget, select randomly
        const randomIndex = Math.floor(Math.random() * remaining.length);
        selected.push(remaining[randomIndex]);
        remaining.splice(randomIndex, 1);
        continue;
      }

      // Pick a random value between 0 and totalWeight
      let random = Math.random() * totalWeight;

      // Find the item that corresponds to this random value
      for (let i = 0; i < remaining.length; i++) {
        random -= remaining[i].dailyBudget;
        if (random <= 0) {
          selected.push(remaining[i]);
          remaining.splice(i, 1);
          break;
        }
      }
    }

    return selected;
  }

  // ============================================================================
  // Real-time Credit Spending Helper
  // ============================================================================

  /**
   * Spend credits for a campaign click
   * Updates both campaign.creditsSpent and vendor's credit balance
   */
  private async spendCreditsForClick(
    campaignId: string,
    vendorProfileId: string,
  ): Promise<boolean> {
    const cost = COST_CONFIG.CLICK;
    if (cost <= 0) return true;

    try {
      // Get vendor's current credit balance
      const vendorProfile = await this.prisma.vendorProfile.findUnique({
        where: { id: vendorProfileId },
        select: { adCredits: true },
      });

      if (!vendorProfile || vendorProfile.adCredits < cost) {
        this.logger.warn(`Insufficient credits for click: vendor ${vendorProfileId}`);
        return false;
      }

      // Get campaign to check budget
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { creditsSpent: true, totalBudget: true },
      });

      if (!campaign || campaign.creditsSpent + cost > campaign.totalBudget) {
        this.logger.warn(`Campaign budget exhausted: ${campaignId}`);
        return false;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Use transaction to ensure atomicity
      await this.prisma.$transaction(async (tx) => {
        // 1. Deduct from vendor's credit balance
        await tx.vendorProfile.update({
          where: { id: vendorProfileId },
          data: { adCredits: { decrement: cost } },
        });

        // 2. Update campaign's credits spent
        await tx.campaign.update({
          where: { id: campaignId },
          data: { creditsSpent: { increment: cost } },
        });

        // 3. Record transaction
        const newBalance = vendorProfile.adCredits - cost;
        await tx.adCreditTransaction.create({
          data: {
            vendorProfileId,
            type: CreditTransactionType.CAMPAIGN_SPEND,
            amount: -cost,
            balance: newBalance,
            referenceType: 'campaign',
            referenceId: campaignId,
            description: `Campaign click`,
          },
        });

        // 4. Update daily stats
        await tx.campaignDailyStats.upsert({
          where: {
            campaignId_date: { campaignId, date: today },
          },
          create: {
            campaignId,
            date: today,
            creditsSpent: cost,
          },
          update: {
            creditsSpent: { increment: cost },
          },
        });
      });

      // Emit event for real-time updates
      this.eventEmitter.emit('ad-credits.spent', {
        vendorProfileId,
        amount: cost,
        campaignId,
        actionType: 'click',
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to spend credits for click: ${error.message}`);
      return false;
    }
  }

  /**
   * Charge credits for impressions (1 credit per 50 impressions)
   * Only charges when impression count reaches a multiple of 50
   */
  private async chargeForImpressions(
    campaignId: string,
    vendorProfileId: string,
    currentImpressions: number,
  ): Promise<void> {
    // Check if we've hit a new threshold (every 50 impressions)
    const newTotal = currentImpressions + 1;
    const previousCharges = Math.floor(currentImpressions / COST_CONFIG.IMPRESSIONS_PER_CREDIT);
    const newCharges = Math.floor(newTotal / COST_CONFIG.IMPRESSIONS_PER_CREDIT);

    // Only charge if we crossed a threshold
    if (newCharges > previousCharges) {
      const creditsToCharge = newCharges - previousCharges;

      try {
        const vendorProfile = await this.prisma.vendorProfile.findUnique({
          where: { id: vendorProfileId },
          select: { adCredits: true },
        });

        if (!vendorProfile || vendorProfile.adCredits < creditsToCharge) {
          this.logger.warn(`Insufficient credits for impression batch: vendor ${vendorProfileId}`);
          return;
        }

        const campaign = await this.prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { creditsSpent: true, totalBudget: true },
        });

        if (!campaign || campaign.creditsSpent + creditsToCharge > campaign.totalBudget) {
          return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await this.prisma.$transaction(async (tx) => {
          await tx.vendorProfile.update({
            where: { id: vendorProfileId },
            data: { adCredits: { decrement: creditsToCharge } },
          });

          await tx.campaign.update({
            where: { id: campaignId },
            data: { creditsSpent: { increment: creditsToCharge } },
          });

          const newBalance = vendorProfile.adCredits - creditsToCharge;
          await tx.adCreditTransaction.create({
            data: {
              vendorProfileId,
              type: CreditTransactionType.CAMPAIGN_SPEND,
              amount: -creditsToCharge,
              balance: newBalance,
              referenceType: 'campaign',
              referenceId: campaignId,
              description: `Campaign impressions (${COST_CONFIG.IMPRESSIONS_PER_CREDIT} impressions)`,
            },
          });

          await tx.campaignDailyStats.upsert({
            where: {
              campaignId_date: { campaignId, date: today },
            },
            create: {
              campaignId,
              date: today,
              creditsSpent: creditsToCharge,
            },
            update: {
              creditsSpent: { increment: creditsToCharge },
            },
          });
        });

        this.eventEmitter.emit('ad-credits.spent', {
          vendorProfileId,
          amount: creditsToCharge,
          campaignId,
          actionType: 'impression_batch',
        });

        this.logger.debug(`Charged ${creditsToCharge} credit(s) for ${COST_CONFIG.IMPRESSIONS_PER_CREDIT} impressions on campaign ${campaignId}`);
      } catch (error) {
        this.logger.error(`Failed to charge for impressions: ${error.message}`);
      }
    }
  }

  // ============================================================================
  // Cache Management
  // ============================================================================

  @Cron(CronExpression.EVERY_5_MINUTES)
  async refreshCache(): Promise<void> {
    try {
      const now = new Date();

      // Get all active profile boost campaigns
      const boostCampaigns = await this.prisma.campaign.findMany({
        where: {
          status: CampaignStatus.ACTIVE,
          type: CampaignType.PROFILE_BOOST,
          startDate: { lte: now },
          OR: [{ endDate: { equals: null } }, { endDate: { gte: now } }],
        },
        select: { vendorProfileId: true },
      });

      // Get all active featured listing campaigns
      const featuredCampaigns = await this.prisma.campaign.findMany({
        where: {
          status: CampaignStatus.ACTIVE,
          type: CampaignType.FEATURED_LISTING,
          startDate: { lte: now },
          OR: [{ endDate: { equals: null } }, { endDate: { gte: now } }],
        },
        select: { vendorProfileId: true },
      });

      this.boostedVendorIds = new Set(boostCampaigns.map((c) => c.vendorProfileId));
      this.featuredVendorIds = new Set(featuredCampaigns.map((c) => c.vendorProfileId));
      this.lastCacheRefresh = now;

      this.logger.debug(
        `Cache refreshed: ${this.boostedVendorIds.size} boosted, ${this.featuredVendorIds.size} featured`,
      );
    } catch (error) {
      this.logger.error(`Failed to refresh campaign cache: ${error.message}`);
    }
  }

  private async ensureCacheFresh(): Promise<void> {
    const now = Date.now();
    if (now - this.lastCacheRefresh.getTime() > this.CACHE_TTL_MS) {
      await this.refreshCache();
    }
  }

  // ============================================================================
  // Quick Checks (for search/list queries)
  // ============================================================================

  /**
   * Check if a vendor has an active profile boost
   * Fast O(1) lookup from cache
   */
  async isVendorBoosted(vendorProfileId: string): Promise<boolean> {
    await this.ensureCacheFresh();
    return this.boostedVendorIds.has(vendorProfileId);
  }

  /**
   * Check if a vendor is featured
   * Fast O(1) lookup from cache
   */
  async isVendorFeatured(vendorProfileId: string): Promise<boolean> {
    await this.ensureCacheFresh();
    return this.featuredVendorIds.has(vendorProfileId);
  }

  /**
   * Get all boosted vendor IDs for search query optimization
   */
  async getBoostedVendorIds(): Promise<string[]> {
    await this.ensureCacheFresh();
    return Array.from(this.boostedVendorIds);
  }

  /**
   * Get all featured vendor IDs
   */
  async getFeaturedVendorIds(): Promise<string[]> {
    await this.ensureCacheFresh();
    return Array.from(this.featuredVendorIds);
  }

  // ============================================================================
  // Profile Boost - For Search Results
  // ============================================================================

  /**
   * Get boosted vendors with boost scores for search ranking
   * Uses weighted random selection for fair distribution
   * Higher dailyBudget = higher chance of being boosted
   */
  async getBoostedVendors(): Promise<BoostedVendor[]> {
    const now = new Date();

    const campaigns = await this.prisma.campaign.findMany({
      where: {
        status: CampaignStatus.ACTIVE,
        type: CampaignType.PROFILE_BOOST,
        startDate: { lte: now },
        OR: [{ endDate: { equals: null } }, { endDate: { gte: now } }],
        // Only get campaigns with remaining budget
        creditsSpent: { lt: this.prisma.campaign.fields.totalBudget },
      },
      include: {
        vendorProfile: {
          select: { adCredits: true },
        },
      },
      orderBy: { dailyBudget: 'desc' },
    });

    // Filter out campaigns where vendor has insufficient credits
    const eligibleCampaigns = campaigns.filter(
      (c) => c.vendorProfile.adCredits >= 1,
    );

    // Use weighted random to shuffle the order while maintaining budget weight
    const shuffled = this.weightedRandomSelect(eligibleCampaigns, eligibleCampaigns.length);

    return shuffled.map((c, index) => ({
      vendorProfileId: c.vendorProfileId,
      campaignId: c.id,
      // Boost score based on position after weighted random + budget
      // This ensures some randomness while still favoring higher budgets
      boostScore: (shuffled.length - index) * 10 + c.dailyBudget,
    }));
  }

  /**
   * Record impression when boosted vendor appears in search
   * Charges 1 credit per 50 impressions
   */
  async recordBoostImpression(campaignId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Get campaign to find vendor and current impressions
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { vendorProfileId: true, status: true, impressions: true },
      });

      if (!campaign || campaign.status !== CampaignStatus.ACTIVE) {
        return;
      }

      // Update impression count and daily stats first
      await this.prisma.$transaction([
        this.prisma.campaign.update({
          where: { id: campaignId },
          data: { impressions: { increment: 1 } },
        }),
        this.prisma.campaignDailyStats.upsert({
          where: {
            campaignId_date: { campaignId, date: today },
          },
          create: {
            campaignId,
            date: today,
            impressions: 1,
          },
          update: {
            impressions: { increment: 1 },
          },
        }),
      ]);

      // Charge credits if we hit a 50-impression threshold
      await this.chargeForImpressions(
        campaignId,
        campaign.vendorProfileId,
        campaign.impressions,
      );
    } catch (error) {
      this.logger.error(`Failed to record boost impression: ${error.message}`);
    }
  }

  /**
   * Record click when user clicks on boosted vendor
   * Charges 1 credit per click
   */
  async recordBoostClick(campaignId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Get campaign to find vendor
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { vendorProfileId: true, status: true },
      });

      if (!campaign || campaign.status !== CampaignStatus.ACTIVE) {
        return;
      }

      // Spend credits for the click
      const success = await this.spendCreditsForClick(
        campaignId,
        campaign.vendorProfileId,
      );

      if (!success) {
        return;
      }

      // Update click count and daily stats
      await this.prisma.$transaction([
        this.prisma.campaign.update({
          where: { id: campaignId },
          data: { clicks: { increment: 1 } },
        }),
        this.prisma.campaignDailyStats.upsert({
          where: {
            campaignId_date: { campaignId, date: today },
          },
          create: {
            campaignId,
            date: today,
            clicks: 1,
          },
          update: {
            clicks: { increment: 1 },
          },
        }),
      ]);
    } catch (error) {
      this.logger.error(`Failed to record boost click: ${error.message}`);
    }
  }

  // ============================================================================
  // Featured Listings - For Homepage & Category Pages
  // ============================================================================

  /**
   * Get featured vendors for homepage
   * Uses weighted random selection for fair distribution
   * Charges credits in real-time for impressions
   */
  async getFeaturedListings(limit: number = 8): Promise<FeaturedListing[]> {
    const now = new Date();

    const campaigns = await this.prisma.campaign.findMany({
      where: {
        status: CampaignStatus.ACTIVE,
        type: CampaignType.FEATURED_LISTING,
        startDate: { lte: now },
        OR: [{ endDate: { equals: null } }, { endDate: { gte: now } }],
        creditsSpent: { lt: this.prisma.campaign.fields.totalBudget },
      },
      include: {
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            categoryId: true,
            profilePhotoUrl: true,
            tagline: true,
            averageRating: true,
            totalReviews: true,
            adCredits: true,
          },
        },
      },
      orderBy: { dailyBudget: 'desc' },
      take: Math.max(limit * 3, 15),
    });

    // Filter out campaigns where vendor has insufficient credits
    const eligibleCampaigns = campaigns.filter(
      (c) => c.vendorProfile.adCredits >= 1,
    );

    // Use weighted random selection
    const selectedCampaigns = this.weightedRandomSelect(eligibleCampaigns, limit);

    // Record impressions with real-time credit spending
    const processedCampaigns: typeof selectedCampaigns = [];
    for (const campaign of selectedCampaigns) {
      const success = await this.recordFeaturedImpressionWithSpend(
        campaign.id,
        campaign.vendorProfileId,
      );
      if (success) {
        processedCampaigns.push(campaign);
      }
    }

    return processedCampaigns.map((c) => ({
      vendorProfileId: c.vendorProfileId,
      campaignId: c.id,
      businessName: c.vendorProfile.businessName,
      slug: c.vendorProfile.slug,
      categoryId: c.vendorProfile.categoryId,
      profilePhotoUrl: c.vendorProfile.profilePhotoUrl || undefined,
      tagline: c.vendorProfile.tagline || undefined,
      averageRating: c.vendorProfile.averageRating
        ? parseFloat(c.vendorProfile.averageRating.toString())
        : undefined,
      totalReviews: c.vendorProfile.totalReviews,
    }));
  }

  /**
   * Get featured vendors by category
   * Uses weighted random selection for fair distribution
   */
  async getFeaturedListingsByCategory(
    categoryId: string,
    limit: number = 4,
  ): Promise<FeaturedListing[]> {
    const now = new Date();

    const campaigns = await this.prisma.campaign.findMany({
      where: {
        status: CampaignStatus.ACTIVE,
        type: CampaignType.FEATURED_LISTING,
        startDate: { lte: now },
        OR: [{ endDate: { equals: null } }, { endDate: { gte: now } }],
        creditsSpent: { lt: this.prisma.campaign.fields.totalBudget },
        vendorProfile: {
          categoryId,
          status: 'ACTIVE',
        },
      },
      include: {
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            categoryId: true,
            profilePhotoUrl: true,
            tagline: true,
            averageRating: true,
            totalReviews: true,
            adCredits: true,
          },
        },
      },
      orderBy: { dailyBudget: 'desc' },
      take: Math.max(limit * 3, 10),
    });

    // Filter and select randomly
    const eligibleCampaigns = campaigns.filter(
      (c) => c.vendorProfile.adCredits >= 1,
    );
    const selectedCampaigns = this.weightedRandomSelect(eligibleCampaigns, limit);

    // Record impressions with credit spending
    const processedCampaigns: typeof selectedCampaigns = [];
    for (const campaign of selectedCampaigns) {
      const success = await this.recordFeaturedImpressionWithSpend(
        campaign.id,
        campaign.vendorProfileId,
      );
      if (success) {
        processedCampaigns.push(campaign);
      }
    }

    return processedCampaigns.map((c) => ({
      vendorProfileId: c.vendorProfileId,
      campaignId: c.id,
      businessName: c.vendorProfile.businessName,
      slug: c.vendorProfile.slug,
      categoryId: c.vendorProfile.categoryId,
      profilePhotoUrl: c.vendorProfile.profilePhotoUrl || undefined,
      tagline: c.vendorProfile.tagline || undefined,
      averageRating: c.vendorProfile.averageRating
        ? parseFloat(c.vendorProfile.averageRating.toString())
        : undefined,
      totalReviews: c.vendorProfile.totalReviews,
    }));
  }

  /**
   * Record featured listing impression with credit charging (1 credit per 50 impressions)
   */
  private async recordFeaturedImpressionWithSpend(
    campaignId: string,
    vendorProfileId: string,
  ): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Get current impressions
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { impressions: true },
      });

      if (!campaign) return false;

      // Update impression count and daily stats
      await this.prisma.$transaction([
        this.prisma.campaign.update({
          where: { id: campaignId },
          data: { impressions: { increment: 1 } },
        }),
        this.prisma.campaignDailyStats.upsert({
          where: {
            campaignId_date: { campaignId, date: today },
          },
          create: {
            campaignId,
            date: today,
            impressions: 1,
          },
          update: {
            impressions: { increment: 1 },
          },
        }),
      ]);

      // Charge credits if we hit a 50-impression threshold
      await this.chargeForImpressions(
        campaignId,
        vendorProfileId,
        campaign.impressions,
      );

      return true;
    } catch (error) {
      this.logger.error(`Failed to record featured impression: ${error.message}`);
      return false;
    }
  }

  // ============================================================================
  // Banner Ads - For Display Advertising
  // ============================================================================

  /**
   * Get banner ads for a specific placement
   * Uses weighted random selection for fair distribution
   * Charges credits in real-time for impressions
   */
  async getBannerAds(
    placement: 'homepage' | 'category' | 'search' | 'profile',
    categoryId?: string,
    limit: number = 3,
  ): Promise<BannerAd[]> {
    const now = new Date();

    const whereClause: any = {
      status: CampaignStatus.ACTIVE,
      type: CampaignType.BANNER_AD,
      startDate: { lte: now },
      OR: [{ endDate: { equals: null } }, { endDate: { gte: now } }],
      // Only get campaigns with remaining budget
      creditsSpent: { lt: this.prisma.campaign.fields.totalBudget },
    };

    // Filter by category if specified
    if (categoryId) {
      whereClause.vendorProfile = { categoryId };
    }

    // Fetch more than needed for weighted random selection
    const campaigns = await this.prisma.campaign.findMany({
      where: whereClause,
      include: {
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            bannerImageUrl: true,
            tagline: true,
            adCredits: true,
          },
        },
      },
      orderBy: { dailyBudget: 'desc' },
      take: Math.max(limit * 3, 10), // Fetch more for random selection pool
    });

    // Filter out campaigns where vendor has insufficient credits
    const eligibleCampaigns = campaigns.filter(
      (c) => c.vendorProfile.adCredits >= 1,
    );

    // Use weighted random selection
    const selectedCampaigns = this.weightedRandomSelect(eligibleCampaigns, limit);

    // Record impressions and spend credits in real-time
    const processedCampaigns: typeof selectedCampaigns = [];
    for (const campaign of selectedCampaigns) {
      const success = await this.recordBannerImpressionWithSpend(
        campaign.id,
        campaign.vendorProfileId,
      );
      if (success) {
        processedCampaigns.push(campaign);
      }
    }

    return processedCampaigns.map((c) => ({
      campaignId: c.id,
      vendorProfileId: c.vendorProfileId,
      targetEntityId: c.targetEntityId || undefined,
      targetEntityType: c.targetEntityType || undefined,
      businessName: c.vendorProfile.businessName,
      slug: c.vendorProfile.slug,
      bannerImageUrl: c.vendorProfile.bannerImageUrl || undefined,
      tagline: c.vendorProfile.tagline || undefined,
    }));
  }

  /**
   * Record banner impression with credit charging (1 credit per 50 impressions)
   */
  private async recordBannerImpressionWithSpend(
    campaignId: string,
    vendorProfileId: string,
  ): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Get current impressions
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { impressions: true },
      });

      if (!campaign) return false;

      // Update impression count and daily stats
      await this.prisma.$transaction([
        this.prisma.campaign.update({
          where: { id: campaignId },
          data: { impressions: { increment: 1 } },
        }),
        this.prisma.campaignDailyStats.upsert({
          where: {
            campaignId_date: { campaignId, date: today },
          },
          create: {
            campaignId,
            date: today,
            impressions: 1,
          },
          update: {
            impressions: { increment: 1 },
          },
        }),
      ]);

      // Charge credits if we hit a 50-impression threshold
      await this.chargeForImpressions(
        campaignId,
        vendorProfileId,
        campaign.impressions,
      );

      return true;
    } catch (error) {
      this.logger.error(`Failed to record banner impression: ${error.message}`);
      return false;
    }
  }

  /**
   * Record banner click with credit spending (1 credit per click)
   */
  async recordBannerClick(campaignId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Get campaign to find vendor
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { vendorProfileId: true, status: true },
      });

      if (!campaign || campaign.status !== CampaignStatus.ACTIVE) {
        return;
      }

      // Spend credits for the click
      const success = await this.spendCreditsForClick(
        campaignId,
        campaign.vendorProfileId,
      );

      if (!success) {
        return;
      }

      // Update click count and daily stats
      await this.prisma.$transaction([
        this.prisma.campaign.update({
          where: { id: campaignId },
          data: { clicks: { increment: 1 } },
        }),
        this.prisma.campaignDailyStats.upsert({
          where: {
            campaignId_date: { campaignId, date: today },
          },
          create: {
            campaignId,
            date: today,
            clicks: 1,
          },
          update: {
            clicks: { increment: 1 },
          },
        }),
      ]);
    } catch (error) {
      this.logger.error(`Failed to record banner click: ${error.message}`);
    }
  }

  // ============================================================================
  // Album Promotion - For Portfolio/Gallery
  // ============================================================================

  /**
   * Get promoted albums for discover/gallery pages
   */
  async getPromotedAlbums(limit: number = 6): Promise<PromotedAlbum[]> {
    const now = new Date();

    const campaigns = await this.prisma.campaign.findMany({
      where: {
        status: CampaignStatus.ACTIVE,
        type: CampaignType.ALBUM_PROMOTION,
        startDate: { lte: now },
        OR: [{ endDate: { equals: null } }, { endDate: { gte: now } }],
      },
      include: {
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
            slug: true,
          },
        },
      },
      orderBy: { dailyBudget: 'desc' },
      take: limit,
    });

    const campaignTargetPortfolioIds = campaigns
      .filter(
        (c) =>
          !!c.targetEntityId &&
          (!c.targetEntityType || c.targetEntityType.toUpperCase() === 'PORTFOLIO'),
      )
      .map((c) => c.targetEntityId as string);

    const vendorIds = Array.from(new Set(campaigns.map((c) => c.vendorProfileId)));

    const [targetedPortfolios, fallbackPortfolios] = await Promise.all([
      this.prisma.portfolio.findMany({
        where: { id: { in: campaignTargetPortfolioIds } },
        select: {
          id: true,
          vendorProfileId: true,
          title: true,
          mediaItems: {
            select: { url: true, thumbnailUrl: true },
            take: 1,
            orderBy: { sortOrder: 'asc' },
          },
        },
      }),
      this.prisma.portfolio.findMany({
        where: { vendorProfileId: { in: vendorIds } },
        select: {
          id: true,
          vendorProfileId: true,
          title: true,
          isFeatured: true,
          sortOrder: true,
          createdAt: true,
          mediaItems: {
            select: { url: true, thumbnailUrl: true },
            take: 1,
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: [
          { isFeatured: 'desc' },
          { sortOrder: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
    ]);

    const targetedPortfolioMap = new Map(targetedPortfolios.map((p) => [p.id, p]));

    const fallbackPortfolioByVendor = new Map<string, (typeof fallbackPortfolios)[number]>();
    for (const portfolio of fallbackPortfolios) {
      if (!fallbackPortfolioByVendor.has(portfolio.vendorProfileId)) {
        fallbackPortfolioByVendor.set(portfolio.vendorProfileId, portfolio);
      }
    }

    // Record impressions
    await Promise.all(
      campaigns.map((c) =>
        this.prisma.campaign.update({
          where: { id: c.id },
          data: { impressions: { increment: 1 } },
        }),
      ),
    );

    return campaigns
      .map((c) => {
        const targetedPortfolio =
          c.targetEntityId && (!c.targetEntityType || c.targetEntityType.toUpperCase() === 'PORTFOLIO')
            ? targetedPortfolioMap.get(c.targetEntityId)
            : null;

        const portfolio = targetedPortfolio || fallbackPortfolioByVendor.get(c.vendorProfileId);
        if (!portfolio) return null;

        // Use the first media item's thumbnail or url as cover image
        const coverImage = portfolio.mediaItems[0]?.thumbnailUrl || portfolio.mediaItems[0]?.url;

        return {
          campaignId: c.id,
          vendorProfileId: c.vendorProfileId,
          portfolioId: portfolio.id,
          title: portfolio.title,
          coverImageUrl: coverImage || undefined,
          businessName: c.vendorProfile.businessName,
          vendorSlug: c.vendorProfile.slug,
        };
      })
      .filter(Boolean) as PromotedAlbum[];
  }

  // ============================================================================
  // Conversion Tracking
  // ============================================================================

  /**
   * Record conversion (lead sent, booking made, etc.)
   */
  async recordConversion(
    vendorProfileId: string,
    conversionType: 'LEAD' | 'BOOKING' | 'INQUIRY',
  ): Promise<void> {
    try {
      // Find active campaigns for this vendor
      const activeCampaigns = await this.prisma.campaign.findMany({
        where: {
          vendorProfileId,
          status: CampaignStatus.ACTIVE,
        },
        select: { id: true },
      });

      if (activeCampaigns.length === 0) return;

      // Increment conversions on all active campaigns
      await this.prisma.campaign.updateMany({
        where: {
          id: { in: activeCampaigns.map((c) => c.id) },
        },
        data: { conversions: { increment: 1 } },
      });

      // Update daily stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const campaign of activeCampaigns) {
        await this.prisma.campaignDailyStats.upsert({
          where: {
            campaignId_date: { campaignId: campaign.id, date: today },
          },
          create: {
            campaignId: campaign.id,
            date: today,
            conversions: 1,
          },
          update: {
            conversions: { increment: 1 },
          },
        });
      }

      this.logger.debug(
        `Recorded ${conversionType} conversion for vendor ${vendorProfileId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to record conversion: ${error.message}`);
    }
  }
}
