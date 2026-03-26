// ============================================================================
// EVENT CREDIT CONTROLLER - User API Gateway
// ============================================================================
// Authenticated endpoints for managing event credits
// ============================================================================

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { UserAccess } from '../../../core/auth/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../core/auth/decorators/current-user.decorator';
import {
  EventCreditService,
  CreditBalanceResponse,
  CanCreateEventResponse,
  ProductWithPricing,
  TierComparisonResponse,
} from '../../../domain/subscription/services/event-credit.service';
import { EventTier, EventCreditTransaction } from '@prisma/client';

// ============================================================================
// DTOs
// ============================================================================

class CheckCreateEventDto {
  tier?: EventTier;
}

class PurchaseCreditsDto {
  productId: string;
  paymentId: string;
  razorpayPaymentId?: string;
}

class GrantCreditsDto {
  tier: EventTier;
  amount: number;
  description: string;
}

// Response DTOs
class CreditBalanceResponseDto implements CreditBalanceResponse {
  userId: string;
  basicCredits: number;
  premiumCredits: number;
  freeEventAvailable: boolean;
  totalCredits: number;
}

class CanCreateEventResponseDto implements CanCreateEventResponse {
  canCreate: boolean;
  tier: EventTier | null;
  source: 'free_event' | 'basic_credit' | 'premium_credit' | null;
  message: string;
}

class TransactionHistoryResponseDto {
  transactions: EventCreditTransaction[];
  total: number;
}

class UserStatsResponseDto {
  totalSpent: number;
  eventsCreated: number;
  creditsPurchased: number;
}

@Controller('event-credits')
@ApiTags('Event Credits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UserAccess()
export class EventCreditController {
  constructor(private readonly eventCreditService: EventCreditService) {}

  // ============================================================================
  // Balance Endpoints
  // ============================================================================

  /**
   * Get current user's credit balance
   */
  @Get('balance')
  @ApiOperation({ summary: 'Get credit balance' })
  @ApiResponse({
    status: 200,
    description: 'Credit balance retrieved successfully',
    type: CreditBalanceResponseDto,
  })
  async getMyBalance(
    @CurrentUser() user: CurrentUserData,
  ): Promise<CreditBalanceResponse> {
    return this.eventCreditService.getBalance(user.id);
  }

  /**
   * Check if user can create an event with specified tier
   */
  @Get('can-create')
  @ApiOperation({ summary: 'Check if user can create an event' })
  @ApiQuery({
    name: 'tier',
    required: false,
    enum: EventTier,
    description: 'Requested event tier (BASIC or PREMIUM)',
  })
  @ApiResponse({
    status: 200,
    description: 'Creation eligibility checked',
    type: CanCreateEventResponseDto,
  })
  async canCreateEvent(
    @CurrentUser() user: CurrentUserData,
    @Query('tier') tier?: EventTier,
  ): Promise<CanCreateEventResponse> {
    return this.eventCreditService.canCreateEvent(user.id, tier);
  }

  // ============================================================================
  // Product Endpoints
  // ============================================================================

  /**
   * Get all available credit products
   */
  @Get('products')
  @ApiOperation({ summary: 'Get available credit products' })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
  })
  async getAllProducts(): Promise<ProductWithPricing[]> {
    return this.eventCreditService.getAllProducts();
  }

  /**
   * Get products by tier
   */
  @Get('products/:tier')
  @ApiOperation({ summary: 'Get products by tier' })
  @ApiResponse({
    status: 200,
    description: 'Products for tier retrieved successfully',
  })
  async getProductsByTier(
    @Query('tier') tier: EventTier,
  ): Promise<ProductWithPricing[]> {
    return this.eventCreditService.getProductsByTier(tier);
  }

  // ============================================================================
  // Tier Features Endpoints
  // ============================================================================

  /**
   * Get features for a specific tier
   */
  @Get('features/:tier')
  @ApiOperation({ summary: 'Get features for tier' })
  @ApiResponse({
    status: 200,
    description: 'Tier features retrieved successfully',
  })
  async getTierFeatures(@Query('tier') tier: EventTier) {
    return this.eventCreditService.getTierFeatures(tier);
  }

  /**
   * Get tier comparison (for pricing page)
   */
  @Get('compare-tiers')
  @ApiOperation({ summary: 'Compare tier features' })
  @ApiResponse({
    status: 200,
    description: 'Tier comparison retrieved successfully',
  })
  async compareTiers(): Promise<TierComparisonResponse> {
    return this.eventCreditService.getTierComparison();
  }

  // ============================================================================
  // Purchase Endpoints
  // ============================================================================

  /**
   * Process credit purchase after successful payment
   */
  @Post('purchase')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Process credit purchase after payment' })
  @ApiResponse({
    status: 201,
    description: 'Credits purchased successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid purchase request',
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async purchaseCredits(
    @Body() dto: PurchaseCreditsDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<EventCreditTransaction> {
    return this.eventCreditService.purchaseCredits(
      user.id,
      dto.productId,
      dto.paymentId,
      dto.razorpayPaymentId,
    );
  }

  // ============================================================================
  // Transaction History Endpoints
  // ============================================================================

  /**
   * Get transaction history
   */
  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of transactions to return',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of transactions to skip',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction history retrieved successfully',
    type: TransactionHistoryResponseDto,
  })
  async getTransactionHistory(
    @CurrentUser() user: CurrentUserData,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<TransactionHistoryResponseDto> {
    return this.eventCreditService.getTransactionHistory(user.id, limit, offset);
  }

  /**
   * Get user statistics
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get user credit statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    type: UserStatsResponseDto,
  })
  async getMyStats(
    @CurrentUser() user: CurrentUserData,
  ): Promise<UserStatsResponseDto> {
    return this.eventCreditService.getUserStats(user.id);
  }
}
