// ============================================================================
// ADS CONTROLLER - Public API for displaying ads/campaigns
// ============================================================================
// Public endpoints to fetch active campaigns for display on frontend
// No authentication required - these are public-facing ads
// ============================================================================

import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { CampaignDisplayService } from '@/domain/subscription/services/campaign-display.service';

@Controller('ads')
export class AdsController {
  constructor(private readonly campaignDisplayService: CampaignDisplayService) {}

  // ============================================================================
  // Featured Listings
  // ============================================================================

  /**
   * Get featured vendors for homepage
   * GET /api/ads/featured
   */
  @Get('featured')
  async getFeaturedListings(@Query('limit') limit?: string) {
    const listings = await this.campaignDisplayService.getFeaturedListings(
      limit ? parseInt(limit, 10) : 8,
    );
    return { listings };
  }

  /**
   * Get featured vendors by category
   * GET /api/ads/featured/category/:categoryId
   */
  @Get('featured/category/:categoryId')
  async getFeaturedByCategory(
    @Param('categoryId') categoryId: string,
    @Query('limit') limit?: string,
  ) {
    const listings = await this.campaignDisplayService.getFeaturedListingsByCategory(
      categoryId,
      limit ? parseInt(limit, 10) : 4,
    );
    return { listings };
  }

  // ============================================================================
  // Banner Ads
  // ============================================================================

  /**
   * Get banner ads for a placement
   * GET /api/ads/banners?placement=homepage&categoryId=xxx
   */
  @Get('banners')
  async getBannerAds(
    @Query('placement') placement: 'homepage' | 'category' | 'search' | 'profile' = 'homepage',
    @Query('categoryId') categoryId?: string,
    @Query('limit') limit?: string,
  ) {
    const banners = await this.campaignDisplayService.getBannerAds(
      placement,
      categoryId,
      limit ? parseInt(limit, 10) : 3,
    );
    return { banners };
  }

  /**
   * Record banner click
   * POST /api/ads/banners/:campaignId/click
   */
  @Post('banners/:campaignId/click')
  async recordBannerClick(@Param('campaignId') campaignId: string) {
    await this.campaignDisplayService.recordBannerClick(campaignId);
    return { success: true };
  }

  // ============================================================================
  // Promoted Albums
  // ============================================================================

  /**
   * Get promoted albums for discover page
   * GET /api/ads/albums
   */
  @Get('albums')
  async getPromotedAlbums(@Query('limit') limit?: string) {
    const albums = await this.campaignDisplayService.getPromotedAlbums(
      limit ? parseInt(limit, 10) : 6,
    );
    return { albums };
  }

  // ============================================================================
  // Boosted Profiles (for search integration)
  // ============================================================================

  /**
   * Get list of boosted vendor IDs
   * Used by search service to prioritize results
   * GET /api/ads/boosted-vendors
   */
  @Get('boosted-vendors')
  async getBoostedVendors() {
    const vendors = await this.campaignDisplayService.getBoostedVendors();
    return { vendors };
  }

  /**
   * Check if a vendor is boosted
   * GET /api/ads/is-boosted/:vendorProfileId
   */
  @Get('is-boosted/:vendorProfileId')
  async isVendorBoosted(@Param('vendorProfileId') vendorProfileId: string) {
    const isBoosted = await this.campaignDisplayService.isVendorBoosted(vendorProfileId);
    return { isBoosted };
  }

  // ============================================================================
  // Click/Impression Tracking
  // ============================================================================

  /**
   * Record impression on boosted profile
   * POST /api/ads/boost/:campaignId/impression
   */
  @Post('boost/:campaignId/impression')
  async recordBoostImpression(@Param('campaignId') campaignId: string) {
    await this.campaignDisplayService.recordBoostImpression(campaignId);
    return { success: true };
  }

  /**
   * Record click on boosted profile
   * POST /api/ads/boost/:campaignId/click
   */
  @Post('boost/:campaignId/click')
  async recordBoostClick(@Param('campaignId') campaignId: string) {
    await this.campaignDisplayService.recordBoostClick(campaignId);
    return { success: true };
  }

  /**
   * Record conversion (lead, booking, inquiry)
   * POST /api/ads/conversion
   */
  @Post('conversion')
  async recordConversion(
    @Body() body: { vendorProfileId: string; type: 'LEAD' | 'BOOKING' | 'INQUIRY' },
  ) {
    await this.campaignDisplayService.recordConversion(body.vendorProfileId, body.type);
    return { success: true };
  }
}
