// ============================================================================
// QUOTATIONS CONTROLLER - Ops Gateway
// ============================================================================

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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { OpsAccess, VendorAccess } from '../../../core/auth/decorators/roles.decorator';
import { QuotationService } from '../../../domain/operations/services/quotation.service';
import {
  CreateQuotationDto,
  UpdateQuotationDto,
  SendQuotationDto,
  RejectQuotationDto,
  QuotationSearchDto,
} from '../../../domain/operations/dto/quotation.dto';
import { Audited } from '../../../core/audit/audit.decorators';
import { AuditSeverity } from '../../../core/audit/audit.types';

@ApiTags('Quotations')
@ApiBearerAuth()
@Controller('quotations')
@UseGuards(JwtAuthGuard, RolesGuard)
@OpsAccess()
export class QuotationsController {
  constructor(private readonly quotationService: QuotationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new quotation' })
  @ApiResponse({ status: 201, description: 'Quotation created' })
  @Audited({
    action: 'CREATE',
    entityType: 'Quotation',
    getEntityId: (req) => req.body?.vendorAgreementId,
    includeRequestBody: true,
    severity: AuditSeverity.WARNING,
  })
  async create(@Body() dto: CreateQuotationDto) {
    return this.quotationService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Search quotations' })
  @ApiResponse({ status: 200, description: 'Quotations list' })
  async search(@Query() query: QuotationSearchDto) {
    return this.quotationService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quotation by ID' })
  @ApiResponse({ status: 200, description: 'Quotation details' })
  @ApiResponse({ status: 404, description: 'Quotation not found' })
  async findById(@Param('id') id: string) {
    return this.quotationService.findById(id);
  }

  @Get('agreement/:vendorAgreementId')
  @ApiOperation({ summary: 'Get quotation by vendor agreement ID' })
  @ApiResponse({ status: 200, description: 'Quotation details' })
  async findByAgreement(@Param('vendorAgreementId') vendorAgreementId: string) {
    return this.quotationService.findByAgreement(vendorAgreementId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update quotation (DRAFT status only)' })
  @ApiResponse({ status: 200, description: 'Quotation updated' })
  @Audited({
    action: 'UPDATE',
    entityType: 'Quotation',
    getEntityId: (req) => req.params?.id,
    includeRequestBody: true,
    severity: AuditSeverity.INFO,
  })
  async update(@Param('id') id: string, @Body() dto: UpdateQuotationDto) {
    return this.quotationService.update(id, dto);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send quotation to vendor' })
  @ApiResponse({ status: 200, description: 'Quotation sent' })
  @Audited({
    action: 'SEND',
    entityType: 'Quotation',
    getEntityId: (req) => req.params?.id,
    severity: AuditSeverity.WARNING,
  })
  async send(@Param('id') id: string, @Body() dto: SendQuotationDto) {
    return this.quotationService.send(id, dto.message);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept quotation (vendor action)' })
  @ApiResponse({ status: 200, description: 'Quotation accepted' })
  @Audited({
    action: 'ACCEPT',
    entityType: 'Quotation',
    getEntityId: (req) => req.params?.id,
    severity: AuditSeverity.CRITICAL,
  })
  async accept(@Param('id') id: string) {
    return this.quotationService.accept(id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject quotation (vendor action)' })
  @ApiResponse({ status: 200, description: 'Quotation rejected' })
  @Audited({
    action: 'REJECT',
    entityType: 'Quotation',
    getEntityId: (req) => req.params?.id,
    includeRequestBody: true,
    severity: AuditSeverity.WARNING,
  })
  async reject(@Param('id') id: string, @Body() dto: RejectQuotationDto) {
    return this.quotationService.reject(id, dto.reason);
  }

  @Post(':id/convert-to-invoice')
  @ApiOperation({ summary: 'Convert accepted quotation to invoice' })
  @ApiResponse({ status: 200, description: 'Quotation converted to invoice' })
  @Audited({
    action: 'CONVERT_TO_INVOICE',
    entityType: 'Quotation',
    getEntityId: (req) => req.params?.id,
    severity: AuditSeverity.CRITICAL,
  })
  async convertToInvoice(@Param('id') id: string) {
    return this.quotationService.convertToInvoice(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete quotation (DRAFT status only)' })
  @ApiResponse({ status: 204, description: 'Quotation deleted' })
  @Audited({
    action: 'DELETE',
    entityType: 'Quotation',
    getEntityId: (req) => req.params?.id,
    severity: AuditSeverity.WARNING,
  })
  async delete(@Param('id') id: string) {
    await this.quotationService.delete(id);
  }
}
