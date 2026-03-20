import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
  PaymentFilterDto,
  PaymentStatsFilterDto,
  RefundPaymentDto,
} from '../dto/admin-payment.dto';

@Controller('payments')
@ApiTags('Admin Payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
export class AdminPaymentController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List all payments with filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of payments' })
  async list(@Query() query: PaymentFilterDto) {
    const {
      userId,
      vendorId,
      subscriptionId,
      status,
      gatewayProvider,
      fromDate,
      toDate,
      minAmount,
      maxAmount,
      page = 1,
      limit = 20,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      ...(userId && { userId }),
      ...(vendorId && { vendorProfileId: vendorId }),
      ...(subscriptionId && { subscriptionId }),
      ...(status && { status }),
      ...(gatewayProvider && { gatewayProvider }),
      ...(fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate && { gte: new Date(fromDate) }),
              ...(toDate && { lte: new Date(toDate) }),
            },
          }
        : {}),
      ...(minAmount !== undefined || maxAmount !== undefined
        ? {
            amount: {
              ...(minAmount !== undefined && { gte: minAmount }),
              ...(maxAmount !== undefined && { lte: maxAmount }),
            },
          }
        : {}),
    };

    const [total, payments] = await this.prisma.$transaction([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          vendorProfile: {
            select: { id: true, businessName: true },
          },
          subscription: {
            select: { id: true, status: true, planId: true },
          },
          invoice: {
            select: { id: true, invoiceNumber: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      data: payments,
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
  @ApiOperation({ summary: 'Get payment statistics' })
  @ApiResponse({ status: 200, description: 'Returns payment statistics' })
  async getStats(@Query() query: PaymentStatsFilterDto) {
    const { fromDate, toDate, gatewayProvider } = query;

    const dateFilter: any = {};
    if (fromDate || toDate) {
      dateFilter.createdAt = {
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(toDate && { lte: new Date(toDate) }),
      };
    }

    const where: any = {
      ...dateFilter,
      ...(gatewayProvider && { gatewayProvider }),
    };

    // Get aggregated stats
    const [
      totalPayments,
      statusCounts,
      totalAmountResult,
      refundedAmountResult,
      recentPayments,
    ] = await this.prisma.$transaction([
      // Total count
      this.prisma.payment.count({ where }),

      // Count by status
      this.prisma.payment.groupBy({
        by: ['status'],
        where,
        orderBy: { status: 'asc' },
        _count: { _all: true },
      }),

      // Total amount for successful payments
      this.prisma.payment.aggregate({
        where: { ...where, status: 'SUCCEEDED' },
        _sum: { amount: true },
      }),

      // Total refunded amount
      this.prisma.payment.aggregate({
        where: { ...where, status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] } },
        _sum: { refundedAmount: true },
      }),

      // Recent payments for trends
      this.prisma.payment.findMany({
        where: { ...where, status: 'SUCCEEDED' },
        select: {
          amount: true,
          currency: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    // Format status counts
    const byStatus = statusCounts.reduce(
      (acc, item) => {
        acc[item.status] = (item._count as any)?._all ?? 0;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total: totalPayments,
      byStatus,
      totalAmount: totalAmountResult._sum.amount || 0,
      totalRefunded: refundedAmountResult._sum.refundedAmount || 0,
      recentTrend: this.calculateTrend(recentPayments),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment details' })
  @ApiResponse({ status: 200, description: 'Returns payment details' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        vendorProfile: {
          select: { id: true, businessName: true, slug: true },
        },
        subscription: {
          include: {
            plan: { select: { id: true, name: true } },
          },
        },
        invoice: {
          include: {
            lineItems: true,
          },
        },
        paymentMethod: {
          select: { id: true, type: true, cardLast4: true, cardBrand: true },
        },
      },
    });

    if (!payment) {
      return { error: 'Payment not found', statusCode: 404 };
    }

    return payment;
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Initiate refund for a payment' })
  @ApiResponse({ status: 200, description: 'Refund initiated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid refund request' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  @AuditSensitive('PAYMENT_REFUNDED', 'Payment')
  async initiateRefund(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: RefundPaymentDto,
    @CurrentUser() admin: CurrentUserData,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      return { success: false, error: 'Payment not found', statusCode: 404 };
    }

    // Validate payment can be refunded
    if (payment.status !== 'SUCCEEDED' && payment.status !== 'PARTIALLY_REFUNDED') {
      return {
        success: false,
        error: 'Only successful or partially refunded payments can be refunded',
        statusCode: 400,
      };
    }

    const paymentAmount = Number(payment.amount);
    const alreadyRefunded = Number(payment.refundedAmount);
    const maxRefundable = paymentAmount - alreadyRefunded;

    // Determine refund amount
    const refundAmount = dto.amount ?? maxRefundable;

    if (refundAmount <= 0 || refundAmount > maxRefundable) {
      return {
        success: false,
        error: `Invalid refund amount. Maximum refundable: ${maxRefundable}`,
        statusCode: 400,
      };
    }

    const isFullRefund = refundAmount === maxRefundable;
    const newRefundedAmount = alreadyRefunded + refundAmount;

    // Update payment record
    const updatedPayment = await this.prisma.payment.update({
      where: { id },
      data: {
        status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        refundedAmount: newRefundedAmount,
        refundedAt: new Date(),
        refundReason: dto.reason,
        metadata: {
          ...(payment.metadata as any),
          refundDetails: {
            amount: refundAmount,
            reason: dto.reason,
            internalNotes: dto.internalNotes,
            initiatedBy: admin?.id,
            initiatedAt: new Date().toISOString(),
          },
        },
      },
    });

    // TODO: Integrate with payment gateway to process actual refund
    // This would be gateway-specific (Stripe, Razorpay, etc.)

    return {
      success: true,
      payment: updatedPayment,
      refundAmount,
      message: `Refund of ${refundAmount} ${payment.currency} initiated successfully`,
    };
  }

  private calculateTrend(payments: { amount: any; createdAt: Date }[]) {
    if (payments.length === 0) return { direction: 'stable', percentage: 0 };

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentTotal = payments
      .filter((p) => p.createdAt >= thirtyDaysAgo)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const previousTotal = payments
      .filter((p) => p.createdAt >= sixtyDaysAgo && p.createdAt < thirtyDaysAgo)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    if (previousTotal === 0) {
      return { direction: 'up', percentage: 100 };
    }

    const percentage = ((recentTotal - previousTotal) / previousTotal) * 100;
    return {
      direction: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'stable',
      percentage: Math.abs(Math.round(percentage)),
    };
  }
}
