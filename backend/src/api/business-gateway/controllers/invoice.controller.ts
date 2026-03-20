// ============================================================================
// INVOICE CONTROLLER - Business API Gateway
// ============================================================================
// Authenticated endpoints for viewing and downloading business invoices
// ============================================================================

import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  Query,
  StreamableFile,
  ParseIntPipe,
  DefaultValuePipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { VendorAccess } from '../../../core/auth/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../core/auth/decorators/current-user.decorator';
import { InvoiceGeneratorService } from '../../../domain/subscription/services/invoice-generator.service';
import { BillingService } from '../../../domain/subscription/services/billing.service';
import { PrismaService } from '../../../core/database/prisma.service';

@Controller('invoices')
@ApiTags('Business Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@VendorAccess()
export class BusinessInvoiceController {
  constructor(
    private readonly invoiceGenerator: InvoiceGeneratorService,
    private readonly billingService: BillingService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get all invoices for current vendor
   */
  @Get()
  @ApiOperation({ summary: 'Get all invoices for current vendor' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of invoices to return (default: 20)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of invoices to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of invoices retrieved successfully',
  })
  async getInvoices(
    @CurrentUser() user: CurrentUserData,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    const vendorProfile = await this.getVendorProfile(user.id);
    return this.billingService.getBusinessInvoices(vendorProfile.id, limit, offset);
  }

  /**
   * Get invoice details
   */
  @Get(':invoiceId')
  @ApiOperation({ summary: 'Get invoice details' })
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID' })
  @ApiResponse({
    status: 200,
    description: 'Invoice details retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  async getInvoice(
    @Param('invoiceId') invoiceId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const vendorProfile = await this.getVendorProfile(user.id);
    const invoice = await this.billingService.getInvoice(invoiceId);

    // Verify invoice belongs to this vendor
    if ((invoice as any).subscription?.vendorProfileId !== vendorProfile.id) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  /**
   * Download invoice as PDF
   */
  @Get(':invoiceId/pdf')
  @ApiOperation({ summary: 'Download invoice as PDF' })
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID' })
  @ApiResponse({
    status: 200,
    description: 'PDF file',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found',
  })
  async downloadInvoicePDF(
    @Param('invoiceId') invoiceId: string,
    @CurrentUser() user: CurrentUserData,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const vendorProfile = await this.getVendorProfile(user.id);
    const invoice = await this.billingService.getInvoice(invoiceId);

    // Verify invoice belongs to this vendor
    if ((invoice as any).subscription?.vendorProfileId !== vendorProfile.id) {
      throw new NotFoundException('Invoice not found');
    }

    const pdfBuffer = await this.invoiceGenerator.generateInvoicePDF(invoiceId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    return new StreamableFile(pdfBuffer);
  }

  /**
   * Get vendor profile for current user
   */
  private async getVendorProfile(userId: string) {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendorProfile) {
      throw new NotFoundException('Vendor profile not found');
    }

    return vendorProfile;
  }
}
