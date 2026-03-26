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
   */
  @Get('pricing-summary')
  @ApiOperation({ summary: 'Get complete pricing summary for pricing page' })
  @ApiResponse({
    status: 200,
    description: 'Complete pricing summary including products and features',
  })
  async getPricingSummary() {
    const [products, comparison] = await Promise.all([
      this.eventCreditService.getAllProducts(),
      this.eventCreditService.getTierComparison(),
    ]);

    // Group products by tier
    const basicProducts = products.filter(p => p.tier === EventTier.BASIC);
    const premiumProducts = products.filter(p => p.tier === EventTier.PREMIUM);

    return {
      tiers: [
        {
          tier: EventTier.BASIC,
          name: 'Basic',
          description: 'Perfect for small to medium events',
          products: basicProducts,
          singleEventPrice: basicProducts.find(p => p.bundleType === BundleType.SINGLE)?.priceInr || 499,
        },
        {
          tier: EventTier.PREMIUM,
          name: 'Premium',
          description: 'Unlimited features for grand celebrations',
          products: premiumProducts,
          singleEventPrice: premiumProducts.find(p => p.bundleType === BundleType.SINGLE)?.priceInr || 1299,
        },
      ],
      featureComparison: comparison.features,
      bundles: [
        { type: BundleType.SINGLE, label: '1 Event', discount: null },
        { type: BundleType.FIVE_PACK, label: '5 Events', discount: 20 },
        { type: BundleType.TEN_PACK, label: '10 Events', discount: 25 },
      ],
    };
  }
}
