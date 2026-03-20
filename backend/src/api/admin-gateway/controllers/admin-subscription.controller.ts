import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { AdminOnly } from '../../../core/auth/decorators/roles.decorator';
import { PrismaService } from '../../../core/database/prisma.service';
import { AuditSensitive } from '../../../core/audit/audit.decorators';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../core/auth/decorators/current-user.decorator';
import {
  SubscriptionFilterDto,
  SubscriptionStatsFilterDto,
  ModifySubscriptionDto,
  AdminCancelSubscriptionDto,
} from '../dto/admin-subscription.dto';

@Controller('subscriptions')
@ApiTags('Admin Subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
export class AdminSubscriptionController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List all subscriptions with filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of subscriptions' })
  async list(@Query() query: SubscriptionFilterDto) {
    const {
      vendorId,
      planId,
      status,
      cancelAtPeriodEnd,
      expiringBefore,
      fromDate,
      toDate,
      search,
      page = 1,
      limit = 20,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      ...(vendorId && { vendorProfileId: vendorId }),
      ...(planId && { planId }),
      ...(status && { status }),
      ...(cancelAtPeriodEnd !== undefined && { cancelAtPeriodEnd }),
      ...(expiringBefore && {
        currentPeriodEnd: { lte: new Date(expiringBefore) },
      }),
      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate && { gte: new Date(fromDate) }),
              ...(toDate && { lte: new Date(toDate) }),
            },
          }
        : {}),
      ...(search && {
        vendorProfile: {
          businessName: { contains: search, mode: 'insensitive' },
        },
      }),
    };

    const [total, subscriptions] = await this.prisma.$transaction([
      this.prisma.subscription.count({ where }),
      this.prisma.subscription.findMany({
        where,
        include: {
          vendorProfile: {
            select: { id: true, businessName: true, slug: true },
          },
          plan: {
            select: { id: true, name: true },
          },
          price: {
            select: { id: true, amount: true, currency: true, billingCycle: true },
          },
          coupon: {
            select: { id: true, code: true, discountType: true, discountValue: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      data: subscriptions,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get subscription statistics' })
  @ApiResponse({ status: 200, description: 'Returns subscription statistics including MRR' })
  async getStats(@Query() query: SubscriptionStatsFilterDto) {
    const { fromDate, toDate, planId } = query;

    const dateFilter: any = {};
    if (fromDate || toDate) {
      dateFilter.createdAt = {
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(toDate && { lte: new Date(toDate) }),
      };
    }

    const where: any = {
      ...dateFilter,
      ...(planId && { planId }),
    };

    // Get aggregated stats
    const [
      totalSubscriptions,
      statusCounts,
      activeSubscriptionsWithPrice,
      recentCancellations,
      planDistribution,
    ] = await this.prisma.$transaction([
      // Total count
      this.prisma.subscription.count({ where }),

      // Count by status
      this.prisma.subscription.groupBy({
        by: ['status'],
        where,
        orderBy: { status: 'asc' },
        _count: { _all: true },
      }),

      // Active subscriptions with price for MRR calculation
      this.prisma.subscription.findMany({
        where: { ...where, status: 'ACTIVE' },
        select: {
          price: {
            select: { amount: true, billingCycle: true },
          },
          discountAmount: true,
        },
      }),

      // Recent cancellations (last 30 days)
      this.prisma.subscription.count({
        where: {
          status: 'CANCELLED',
          cancelledAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),

      // Distribution by plan
      this.prisma.subscription.groupBy({
        by: ['planId'],
        where: { status: 'ACTIVE' },
        orderBy: { planId: 'asc' },
        _count: { _all: true },
      }),
    ]);

    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = activeSubscriptionsWithPrice.reduce((total, sub) => {
      const price = sub.price;
      if (!price) return total;

      const amount = Number(price.amount) - Number(sub.discountAmount || 0);

      // Normalize to monthly
      switch (price.billingCycle) {
        case 'MONTHLY':
          return total + amount;
        case 'QUARTERLY':
          return total + amount / 3;
        case 'YEARLY':
          return total + amount / 12;
        default:
          return total + amount;
      }
    }, 0);

    // Format status counts
    const byStatus = statusCounts.reduce(
      (acc, item) => {
        acc[item.status] = (item._count as any)?._all ?? 0;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Get plan names for distribution
    const planIds = planDistribution.map((p) => p.planId);
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, name: true },
    });

    const planMap = new Map(plans.map((p) => [p.id, p]));
    const byPlan = planDistribution.map((p) => ({
      planId: p.planId,
      planName: planMap.get(p.planId)?.name,
      count: (p._count as any)?._all ?? 0,
    }));

    return {
      total: totalSubscriptions,
      byStatus,
      byPlan,
      activeCount: byStatus['ACTIVE'] || 0,
      trialingCount: byStatus['TRIALING'] || 0,
      cancelledCount: byStatus['CANCELLED'] || 0,
      mrr: Math.round(mrr * 100) / 100,
      recentCancellations,
      churnRate:
        (byStatus['ACTIVE'] || 0) > 0
          ? Math.round((recentCancellations / (byStatus['ACTIVE'] || 1)) * 100 * 100) / 100
          : 0,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription details' })
  @ApiResponse({ status: 200, description: 'Returns subscription details' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  async getById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        vendorProfile: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
          },
        },
        plan: {
          include: {
            features: true,
            prices: true,
          },
        },
        price: true,
        coupon: true,
        paymentMethods: {
          select: { id: true, type: true, cardLast4: true, cardBrand: true, isDefault: true },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            totalAmount: true,
            currency: true,
            issuedAt: true,
            paidAt: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            createdAt: true,
            gatewayProvider: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        usageRecords: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!subscription) {
      return { error: 'Subscription not found', statusCode: 404 };
    }

    return subscription;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modify subscription (extend trial, change plan, etc.)' })
  @ApiResponse({ status: 200, description: 'Subscription modified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid modification request' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @AuditSensitive('SUBSCRIPTION_MODIFIED', 'Subscription')
  async modify(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: ModifySubscriptionDto,
    @CurrentUser() admin: CurrentUserData,
  ) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: { plan: true, price: true },
    });

    if (!subscription) {
      return { success: false, error: 'Subscription not found', statusCode: 404 };
    }

    const updateData: any = {};

    // Handle plan change
    if (dto.planId && dto.planId !== subscription.planId) {
      const newPlan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: dto.planId },
        include: { prices: true },
      });

      if (!newPlan) {
        return { success: false, error: 'Plan not found', statusCode: 400 };
      }

      updateData.plan = { connect: { id: dto.planId } };

      // If price ID provided, use it; otherwise find default price
      if (dto.priceId) {
        const priceExists = newPlan.prices.some((p) => p.id === dto.priceId);
        if (!priceExists) {
          return { success: false, error: 'Price not found for this plan', statusCode: 400 };
        }
        updateData.price = { connect: { id: dto.priceId } };
      } else {
        // Use first monthly price or first available
        const defaultPrice =
          newPlan.prices.find((p) => p.billingCycle === 'MONTHLY') || newPlan.prices[0];
        if (defaultPrice) {
          updateData.price = { connect: { id: defaultPrice.id } };
        }
      }
    } else if (dto.priceId && dto.priceId !== subscription.priceId) {
      updateData.price = { connect: { id: dto.priceId } };
    }

    // Handle status change
    if (dto.status && dto.status !== subscription.status) {
      updateData.status = dto.status;

      // Record status history
      await this.prisma.subscriptionStatusHistory.create({
        data: {
          subscriptionId: id,
          fromStatus: subscription.status,
          toStatus: dto.status,
          reason: dto.reason || `Status changed by admin`,
          changedBy: admin?.id,
        },
      });
    }

    // Handle trial extension
    if (dto.trialEnd) {
      updateData.trialEnd = new Date(dto.trialEnd);
      if (subscription.status === 'ACTIVE') {
        updateData.status = 'TRIALING';
      }
    }

    // Handle period extension
    if (dto.currentPeriodEnd) {
      updateData.currentPeriodEnd = new Date(dto.currentPeriodEnd);
    }

    // Handle cancel at period end
    if (dto.cancelAtPeriodEnd !== undefined) {
      updateData.cancelAtPeriodEnd = dto.cancelAtPeriodEnd;
      if (!dto.cancelAtPeriodEnd) {
        updateData.cancelledAt = null;
      }
    }

    const updatedSubscription = await this.prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        plan: { select: { id: true, name: true } },
        price: { select: { id: true, amount: true, currency: true, billingCycle: true } },
      },
    });

    return {
      success: true,
      subscription: updatedSubscription,
      modifications: Object.keys(dto).filter((k) => k !== 'reason'),
    };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Admin cancel subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid cancellation request' })
  @ApiResponse({ status: 404, description: 'Subscription not found' })
  @AuditSensitive('SUBSCRIPTION_CANCELLED', 'Subscription')
  async cancel(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: AdminCancelSubscriptionDto,
    @CurrentUser() admin: CurrentUserData,
  ) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      return { success: false, error: 'Subscription not found', statusCode: 404 };
    }

    if (subscription.status === 'CANCELLED') {
      return { success: false, error: 'Subscription is already cancelled', statusCode: 400 };
    }

    const updateData: any = {
      cancelledAt: new Date(),
      cancellationReason: dto.reason,
    };

    if (dto.immediate) {
      updateData.status = 'CANCELLED';
      updateData.currentPeriodEnd = new Date();
    } else {
      updateData.cancelAtPeriodEnd = true;
    }

    // Record status history
    await this.prisma.subscriptionStatusHistory.create({
      data: {
        subscriptionId: id,
        fromStatus: subscription.status,
        toStatus: dto.immediate ? 'CANCELLED' : subscription.status,
        reason: `Admin cancellation: ${dto.reason}. ${dto.immediate ? 'Immediate cancellation.' : 'Cancels at period end.'}${dto.processRefund ? ' Refund requested.' : ''}${dto.internalNotes ? ` Notes: ${dto.internalNotes}` : ''}`,
        changedBy: admin?.id,
      },
    });

    const updatedSubscription = await this.prisma.subscription.update({
      where: { id },
      data: updateData,
    });

    // TODO: If processRefund is true, calculate and initiate refund
    // This would involve calculating remaining period value and creating a refund

    return {
      success: true,
      subscription: updatedSubscription,
      cancellationType: dto.immediate ? 'immediate' : 'at_period_end',
      message: dto.immediate
        ? 'Subscription cancelled immediately'
        : `Subscription will be cancelled at period end (${subscription.currentPeriodEnd})`,
    };
  }
}
