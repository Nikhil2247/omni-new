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
  InvoiceFilterDto,
  InvoiceStatsFilterDto,
  VoidInvoiceDto,
} from '../dto/admin-invoice.dto';

@Controller('invoices')
@ApiTags('Admin Invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
export class AdminInvoiceController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List all invoices with filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of invoices' })
  async list(@Query() query: InvoiceFilterDto) {
    const {
      subscriptionId,
      vendorId,
      status,
      invoiceNumber,
      fromDate,
      toDate,
      dueBefore,
      minAmount,
      maxAmount,
      page = 1,
      limit = 20,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      ...(subscriptionId && { subscriptionId }),
      ...(status && { status }),
      ...(invoiceNumber && {
        invoiceNumber: { contains: invoiceNumber, mode: 'insensitive' },
      }),
      ...(fromDate || toDate
        ? {
            issuedAt: {
              ...(fromDate && { gte: new Date(fromDate) }),
              ...(toDate && { lte: new Date(toDate) }),
            },
          }
        : {}),
      ...(dueBefore && {
        dueDate: { lte: new Date(dueBefore) },
      }),
      ...(minAmount !== undefined || maxAmount !== undefined
        ? {
            totalAmount: {
              ...(minAmount !== undefined && { gte: minAmount }),
              ...(maxAmount !== undefined && { lte: maxAmount }),
            },
          }
        : {}),
    };

    // Handle vendor filter through subscription relation
    if (vendorId) {
      where.subscription = {
        vendorProfileId: vendorId,
      };
    }

    const [total, invoices] = await this.prisma.$transaction([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        include: {
          subscription: {
            select: {
              id: true,
              status: true,
              vendorProfile: {
                select: { id: true, businessName: true, slug: true },
              },
              plan: {
                select: { id: true, name: true },
              },
            },
          },
          payments: {
            select: { id: true, status: true, amount: true },
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      data: invoices,
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
  @ApiOperation({ summary: 'Get invoice statistics' })
  @ApiResponse({ status: 200, description: 'Returns invoice statistics' })
  async getStats(@Query() query: InvoiceStatsFilterDto) {
    const { fromDate, toDate } = query;

    const dateFilter: any = {};
    if (fromDate || toDate) {
      dateFilter.issuedAt = {
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(toDate && { lte: new Date(toDate) }),
      };
    }

    const where: any = { ...dateFilter };

    // Get aggregated stats
    const [
      totalInvoices,
      statusCounts,
      totalAmountResult,
      paidAmountResult,
      overdueInvoices,
      recentInvoices,
    ] = await this.prisma.$transaction([
      // Total count
      this.prisma.invoice.count({ where }),

      // Count by status
      this.prisma.invoice.groupBy({
        by: ['status'],
        where,
        orderBy: { status: 'asc' },
        _count: { _all: true },
      }),

      // Total invoiced amount
      this.prisma.invoice.aggregate({
        where: { ...where, status: { not: 'VOIDED' } },
        _sum: { totalAmount: true },
      }),

      // Total paid amount
      this.prisma.invoice.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { totalAmount: true },
      }),

      // Overdue invoices count
      this.prisma.invoice.count({
        where: {
          ...where,
          status: { in: ['OPEN', 'PAST_DUE'] },
          dueDate: { lt: new Date() },
        },
      }),

      // Recent invoices for collection rate calculation
      this.prisma.invoice.findMany({
        where: { ...where, status: { not: 'DRAFT' } },
        select: {
          status: true,
          totalAmount: true,
          issuedAt: true,
          paidAt: true,
        },
        orderBy: { issuedAt: 'desc' },
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

    // Calculate collection rate
    const eligibleForCollection = recentInvoices.filter(
      (inv) => !['DRAFT', 'VOIDED'].includes(inv.status),
    );
    const collected = recentInvoices.filter((inv) => inv.status === 'PAID');

    const collectionRate =
      eligibleForCollection.length > 0
        ? Math.round((collected.length / eligibleForCollection.length) * 100 * 100) / 100
        : 0;

    // Calculate average days to pay
    const paidInvoicesWithDays = collected
      .filter((inv) => inv.issuedAt && inv.paidAt)
      .map((inv) => {
        const issued = new Date(inv.issuedAt!);
        const paid = new Date(inv.paidAt!);
        return (paid.getTime() - issued.getTime()) / (1000 * 60 * 60 * 24);
      });

    const avgDaysToPay =
      paidInvoicesWithDays.length > 0
        ? Math.round(
            paidInvoicesWithDays.reduce((sum, days) => sum + days, 0) /
              paidInvoicesWithDays.length,
          )
        : 0;

    return {
      total: totalInvoices,
      byStatus,
      totalInvoiced: totalAmountResult._sum.totalAmount || 0,
      totalPaid: paidAmountResult._sum.totalAmount || 0,
      outstanding:
        (Number(totalAmountResult._sum.totalAmount) || 0) -
        (Number(paidAmountResult._sum.totalAmount) || 0),
      overdueCount: overdueInvoices,
      collectionRate,
      avgDaysToPay,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice details' })
  @ApiResponse({ status: 200, description: 'Returns invoice details' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            vendorProfile: {
              include: {
                user: {
                  select: { id: true, email: true, firstName: true, lastName: true },
                },
              },
            },
            plan: {
              select: { id: true, name: true },
            },
          },
        },
        lineItems: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          include: {
            paymentMethod: {
              select: { id: true, type: true, cardLast4: true, cardBrand: true },
            },
          },
        },
      },
    });

    if (!invoice) {
      return { error: 'Invoice not found', statusCode: 404 };
    }

    return invoice;
  }

  @Post(':id/void')
  @ApiOperation({ summary: 'Void an invoice' })
  @ApiResponse({ status: 200, description: 'Invoice voided successfully' })
  @ApiResponse({ status: 400, description: 'Invalid void request' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @AuditSensitive('INVOICE_VOIDED', 'Invoice')
  async voidInvoice(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: VoidInvoiceDto,
    @CurrentUser() admin: CurrentUserData,
  ) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!invoice) {
      return { success: false, error: 'Invoice not found', statusCode: 404 };
    }

    // Check if invoice can be voided
    if (invoice.status === 'VOIDED') {
      return { success: false, error: 'Invoice is already voided', statusCode: 400 };
    }

    if (invoice.status === 'PAID') {
      return {
        success: false,
        error: 'Paid invoices cannot be voided. Process a refund instead.',
        statusCode: 400,
      };
    }

    // Check for pending payments
    const pendingPayments = invoice.payments.filter(
      (p) => p.status === 'PENDING' || p.status === 'PROCESSING',
    );
    if (pendingPayments.length > 0) {
      return {
        success: false,
        error: 'Cannot void invoice with pending payments',
        statusCode: 400,
      };
    }

    // Void the invoice
    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: 'VOIDED',
        voidedAt: new Date(),
      },
    });

    // Create audit note via metadata or separate audit system
    // The @AuditSensitive decorator will handle audit logging

    return {
      success: true,
      invoice: updatedInvoice,
      message: 'Invoice voided successfully',
      voidedBy: admin?.id,
      voidedAt: updatedInvoice.voidedAt,
      reason: dto.reason,
    };
  }

  @Post(':id/resend')
  @ApiOperation({ summary: 'Resend invoice email' })
  @ApiResponse({ status: 200, description: 'Invoice email sent successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @AuditSensitive('INVOICE_RESENT', 'Invoice')
  async resendInvoice(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() admin: CurrentUserData,
  ) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            vendorProfile: {
              include: {
                user: { select: { email: true } },
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return { success: false, error: 'Invoice not found', statusCode: 404 };
    }

    if (invoice.status === 'VOIDED') {
      return { success: false, error: 'Cannot resend voided invoice', statusCode: 400 };
    }

    // TODO: Integrate with email service to send invoice
    // This would trigger an email with invoice details/PDF

    return {
      success: true,
      message: 'Invoice resend initiated',
      sentTo: invoice.subscription?.vendorProfile?.user?.email,
      invoiceNumber: invoice.invoiceNumber,
      triggeredBy: admin?.id,
    };
  }

  @Post(':id/mark-paid')
  @ApiOperation({ summary: 'Manually mark invoice as paid' })
  @ApiResponse({ status: 200, description: 'Invoice marked as paid' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @AuditSensitive('INVOICE_MARKED_PAID', 'Invoice')
  async markAsPaid(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() admin: CurrentUserData,
  ) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return { success: false, error: 'Invoice not found', statusCode: 404 };
    }

    if (invoice.status === 'PAID') {
      return { success: false, error: 'Invoice is already paid', statusCode: 400 };
    }

    if (invoice.status === 'VOIDED') {
      return { success: false, error: 'Cannot mark voided invoice as paid', statusCode: 400 };
    }

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    return {
      success: true,
      invoice: updatedInvoice,
      message: 'Invoice marked as paid',
      markedBy: admin?.id,
    };
  }
}
