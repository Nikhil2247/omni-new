// ============================================================================
// USER SUBSCRIPTION CONTROLLER - User API Gateway
// ============================================================================
// Authenticated endpoints for managing user subscriptions
// ============================================================================

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { UserAccess } from '../../../core/auth/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../core/auth/decorators/current-user.decorator';
import { UserSubscriptionService } from '../../../domain/subscription/services/user-subscription.service';
import { UserUsageService } from '../../../domain/subscription/services/user-usage.service';
import {
  CreateUserSubscriptionDto,
  UpgradeUserSubscriptionDto,
  CancelUserSubscriptionDto,
  UserSubscriptionResponseDto,
  UserSubscriptionStatusDto,
  EventUsageSummaryResponseDto,
  UserFeatureLimitResponseDto,
} from '../../../domain/subscription/dto/user-subscription.dto';

@Controller('subscription')
@ApiTags('User Subscription')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UserAccess()
export class UserSubscriptionController {
  constructor(
    private readonly subscriptionService: UserSubscriptionService,
    private readonly usageService: UserUsageService,
  ) {}

  /**
   * Get current user's subscription
   */
  @Get()
  @ApiOperation({ summary: 'Get current subscription' })
  @ApiResponse({
    status: 200,
    description: 'Current subscription retrieved successfully',
    type: UserSubscriptionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No subscription found',
  })
  async getMySubscription(
    @CurrentUser() user: CurrentUserData,
  ): Promise<UserSubscriptionResponseDto | UserSubscriptionStatusDto> {
    const subscription = await this.subscriptionService.findByUserId(user.id);

    if (!subscription) {
      // Return status object when no subscription exists
      return {
        hasActiveSubscription: false,
        tier: null,
        status: null,
        expiresAt: undefined,
        willRenew: undefined,
        daysUntilExpiration: undefined,
      };
    }

    return subscription as UserSubscriptionResponseDto;
  }

  /**
   * Get overall usage summary across all events
   */
  @Get('usage')
  @ApiOperation({ summary: 'Get overall usage summary' })
  @ApiResponse({
    status: 200,
    description: 'Usage summary retrieved successfully',
    type: [UserFeatureLimitResponseDto],
  })
  async getMyUsage(
    @CurrentUser() user: CurrentUserData,
  ): Promise<UserFeatureLimitResponseDto[]> {
    const featureLimits = await this.usageService.getAllFeatureLimits(user.id);

    return featureLimits.map((f: any) => ({
      featureKey: f.featureKey,
      limit: f.isUnlimited ? -1 : (f.limitValue ?? 0),
      used: 0, // Overall usage requires aggregation across events
      remaining: f.isUnlimited ? -1 : (f.limitValue ?? 0),
      isUnlimited: f.isUnlimited,
    }));
  }

  /**
   * Get usage for a specific event
   */
  @Get('events/:eventId/usage')
  @ApiOperation({ summary: 'Get usage for specific event' })
  @ApiParam({
    name: 'eventId',
    description: 'The unique identifier of the event',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Event usage retrieved successfully',
    type: EventUsageSummaryResponseDto,
  })
  async getEventUsage(
    @CurrentUser() user: CurrentUserData,
    @Param('eventId') eventId: string,
  ): Promise<EventUsageSummaryResponseDto> {
    const usage = await this.usageService.getEventUsage(user.id, eventId);
    return {
      eventId: usage.eventId,
      features: usage.features.map((f) => ({
        featureKey: f.featureKey,
        limit: f.limit,
        used: f.used,
        remaining: f.remaining,
        isUnlimited: f.isUnlimited,
      })),
      totalFeaturesUsed: usage.totalFeaturesUsed,
    };
  }

  /**
   * Subscribe to a plan
   */
  @Post('subscribe')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Subscribe to a plan' })
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully',
    type: UserSubscriptionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid subscription request or user already has a subscription',
  })
  async subscribe(
    @Body() dto: CreateUserSubscriptionDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<UserSubscriptionResponseDto> {
    // Ensure user can only subscribe for themselves
    const subscriptionDto: CreateUserSubscriptionDto = {
      ...dto,
      userId: user.id,
    };

    try {
      const subscription = await this.subscriptionService.create(subscriptionDto);
      return subscription as UserSubscriptionResponseDto;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create subscription');
    }
  }

  /**
   * Upgrade subscription to a higher tier
   */
  @Post('upgrade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upgrade subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription upgraded successfully',
    type: UserSubscriptionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid upgrade request or target plan is not an upgrade',
  })
  @ApiResponse({
    status: 404,
    description: 'No active subscription found',
  })
  async upgradePlan(
    @Body() dto: UpgradeUserSubscriptionDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<UserSubscriptionResponseDto> {
    try {
      const subscription = await this.subscriptionService.upgrade(user.id, dto);
      return subscription as UserSubscriptionResponseDto;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to upgrade subscription');
    }
  }

  /**
   * Cancel subscription
   */
  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription cancelled successfully',
    type: UserSubscriptionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Subscription is already cancelled',
  })
  @ApiResponse({
    status: 404,
    description: 'No active subscription found',
  })
  async cancelSubscription(
    @Body() dto: CancelUserSubscriptionDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<UserSubscriptionResponseDto> {
    try {
      const subscription = await this.subscriptionService.cancel(user.id, dto);
      return subscription as UserSubscriptionResponseDto;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to cancel subscription');
    }
  }

  /**
   * Reactivate a cancelled subscription
   */
  @Post('reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate cancelled subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription reactivated successfully',
    type: UserSubscriptionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Subscription is not cancelled or period has expired',
  })
  @ApiResponse({
    status: 404,
    description: 'No subscription found',
  })
  async reactivateSubscription(
    @CurrentUser() user: CurrentUserData,
  ): Promise<UserSubscriptionResponseDto> {
    try {
      const subscription = await this.subscriptionService.reactivate(user.id);
      return subscription as UserSubscriptionResponseDto;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to reactivate subscription');
    }
  }
}
