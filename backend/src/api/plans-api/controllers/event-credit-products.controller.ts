// ============================================================================
// EVENT CREDIT PRODUCTS CONTROLLER - Plans API
// ============================================================================
// Public endpoints for displaying event credit products and tier features
// Routes: /api/plans/event-credits/*
// ============================================================================

import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Public } from '../../../core/auth/decorators/public.decorator';
import {
  EventCreditService,
  ProductWithPricing,
  TierComparisonResponse,
} from '../../../domain/subscription/services/event-credit.service';
import { EventTier, EventTierFeature, BundleType } from '@prisma/client';

@Controller('plans/event-credits')
@ApiTags('Event Credit Products')
@Public()
export class EventCreditProductsController {
  constructor(private readonly eventCreditService: EventCreditService) {}

  /**
   * Get all available event credit products
   * Returns products formatted for display on the pricing page
   */
  @Get('products')
  @ApiOperation({ summary: 'Get all available event credit products' })
  @ApiResponse({
    status: 200,
    description: 'List of available event credit products',
  })
  async getAllProducts(): Promise<ProductWithPricing[]> {
    return this.eventCreditService.getAllProducts();
  }

  /**
   * Get event credit products by tier
   */
  @Get('products/tier/:tier')
  @ApiOperation({ summary: 'Get products for a specific tier' })
  @ApiParam({
    name: 'tier',
    enum: EventTier,
    description: 'Event tier (BASIC or PREMIUM)',
  })
  @ApiResponse({
    status: 200,
    description: 'Products for the specified tier',
  })
  async getProductsByTier(
    @Param('tier') tier: EventTier,
  ): Promise<ProductWithPricing[]> {
    return this.eventCreditService.getProductsByTier(tier);
  }

  /**
   * Get a specific product by tier and bundle type
   */
  @Get('products/:tier/:bundleType')
  @ApiOperation({ summary: 'Get specific product by tier and bundle' })
  @ApiParam({
    name: 'tier',
    enum: EventTier,
    description: 'Event tier (BASIC or PREMIUM)',
  })
  @ApiParam({
    name: 'bundleType',
    enum: BundleType,
    description: 'Bundle type (SINGLE, FIVE_PACK, TEN_PACK)',
  })
  @ApiResponse({
    status: 200,
    description: 'Product details',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async getProduct(
    @Param('tier') tier: EventTier,
    @Param('bundleType') bundleType: BundleType,
  ): Promise<ProductWithPricing> {
    const product = await this.eventCreditService.getProduct(tier, bundleType);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  /**
   * Get tier comparison for pricing page
   * Returns side-by-side comparison of BASIC vs PREMIUM features
   */
  @Get('compare')
  @ApiOperation({ summary: 'Get tier comparison for pricing page' })
  @ApiResponse({
    status: 200,
    description: 'Tier comparison data for pricing page',
  })
  async compareTiers(): Promise<TierComparisonResponse> {
    return this.eventCreditService.getTierComparison();
  }

  /**
   * Get features for a specific tier
   */
  @Get('features/:tier')
  @ApiOperation({ summary: 'Get features for a specific tier' })
  @ApiParam({
    name: 'tier',
    enum: EventTier,
    description: 'Event tier (BASIC or PREMIUM)',
  })
  @ApiResponse({
    status: 200,
    description: 'Features for the specified tier',
  })
  async getTierFeatures(
    @Param('tier') tier: EventTier,
  ): Promise<EventTierFeature[]> {
    return this.eventCreditService.getTierFeatures(tier);
  }

  /**
   * Get pricing summary for display
   * Combines products and features in a format suitable for the pricing page
   *
   * UNLIMITED EVENTS MODEL:
   * - Users can create unlimited events for free
   * - Tier (BASIC/PREMIUM) determines feature limits per event
   */
  @Get('pricing-summary')
  @ApiOperation({ summary: 'Get complete pricing summary for pricing page (Unlimited Events Model)' })
  @ApiResponse({
    status: 200,
    description: 'Complete pricing summary including tier features for unlimited events',
  })
  async getPricingSummary() {
    // UNLIMITED EVENTS MODEL - v2
    console.log('[PricingSummary] Fetching tier features for unlimited events model');
    const [basicFeatures, premiumFeatures, comparison] = await Promise.all([
      this.eventCreditService.getTierFeatures(EventTier.BASIC),
      this.eventCreditService.getTierFeatures(EventTier.PREMIUM),
      this.eventCreditService.getTierComparison(),
    ]);

    // Format features for display
    const formatFeatures = (features: EventTierFeature[]) => {
      return features
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(f => ({
          key: f.featureKey,
          name: f.featureName,
          description: f.description,
          limitType: f.limitType,
          limitValue: f.limitValue,
          displayValue: this.formatFeatureDisplay(f),
          included: f.limitType === 'BOOLEAN' ? f.limitValue === 1 : (f.limitValue ?? 0) > 0,
          isHighlighted: f.isHighlighted,
        }));
    };

    return {
      // Unlimited events model info
      unlimitedEvents: true,
      unlimitedEventsMessage: 'Create unlimited events for free. Choose a tier based on the features you need per event.',

      tiers: [
        {
          tier: EventTier.BASIC,
          name: 'Basic',
          description: 'Perfect for intimate celebrations and smaller events',
          price: 'Free',
          priceSubtext: 'Unlimited events',
          features: formatFeatures(basicFeatures),
          isPopular: false,
        },
        {
          tier: EventTier.PREMIUM,
          name: 'Premium',
          description: 'Full-featured for grand celebrations and large events',
          price: 'Free',
          priceSubtext: 'Unlimited events',
          features: formatFeatures(premiumFeatures),
          isPopular: true,
        },
      ],
      featureComparison: comparison.features,
    };
  }

  /**
   * Format feature value for display
   */
  private formatFeatureDisplay(feature: EventTierFeature): string {
    if (feature.limitType === 'BOOLEAN') {
      return feature.limitValue === 1 ? 'Yes' : 'No';
    }
    if (feature.limitType === 'UNLIMITED' || feature.limitValue === null || feature.limitValue === -1) {
      return 'Unlimited';
    }
    // Format number with appropriate suffix
    if (feature.featureKey.includes('storage')) {
      return feature.limitValue >= 1000
        ? `${(feature.limitValue / 1000).toFixed(0)} GB`
        : `${feature.limitValue} MB`;
    }
    return feature.limitValue.toLocaleString('en-IN');
  }
}
