import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProvisionalInvoiceService } from '../../../domain/operations/services/provisional-invoice.service';
import {
  CreateProvisionalInvoiceDto,
  UpdateProvisionalInvoiceDto,
} from '../../../domain/operations/dto/provisional-invoice.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { OpsAccess } from '../../../core/auth/decorators/roles.decorator';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@OpsAccess()
export class InvoicesController {
  constructor(private readonly invoiceService: ProvisionalInvoiceService) {}

  @Post()
  create(@Body() dto: CreateProvisionalInvoiceDto) {
    return this.invoiceService.create(dto);
  }

  @Get('all')
  findAll(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.invoiceService.findAll({
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.invoiceService.findById(id);
  }

  @Get()
  findByAgreement(@Query('vendorAgreementId') vendorAgreementId?: string) {
    if (!vendorAgreementId) {
      return [];
    }
    return this.invoiceService.findByAgreement(vendorAgreementId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProvisionalInvoiceDto) {
    return this.invoiceService.update(id, dto);
  }

  @Put(':id/paid')
  markPaid(@Param('id') id: string) {
    return this.invoiceService.markAsPaid(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.invoiceService.delete(id);
    return { success: true };
  }
}
