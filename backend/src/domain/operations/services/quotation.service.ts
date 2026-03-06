// ============================================================================
// QUOTATION SERVICE - Operations Domain
// ============================================================================

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Quotation, QuotationStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/client';
import { QuotationRepository } from '../repositories/quotation.repository';
import { ProvisionalInvoiceService } from './provisional-invoice.service';
import {
  CreateQuotationDto,
  UpdateQuotationDto,
  QuotationSearchDto,
} from '../dto/quotation.dto';

@Injectable()
export class QuotationService {
  private readonly logger = new Logger(QuotationService.name);

  constructor(
    private readonly quotationRepository: QuotationRepository,
    private readonly invoiceService: ProvisionalInvoiceService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateQuotationDto): Promise<Quotation> {
    this.logger.log(
      `Creating quotation for agreement: ${dto.vendorAgreementId}`,
    );

    // Check if quotation already exists for this agreement
    const existing = await this.quotationRepository.findByAgreement(
      dto.vendorAgreementId,
    );
    if (existing) {
      throw new ConflictException(
        'Quotation already exists for this agreement',
      );
    }

    // Generate quotation number
    const quotationNumber =
      await this.quotationRepository.generateQuotationNumber();

    const quotation = await this.quotationRepository.create({
      vendorAgreement: { connect: { id: dto.vendorAgreementId } },
      quotationNumber,
      currency: dto.currency || 'INR',
      items: dto.items as unknown as object,
      subtotal: new Decimal(dto.subtotal),
      taxRate: dto.taxRate ? new Decimal(dto.taxRate) : null,
      taxAmount: dto.taxAmount ? new Decimal(dto.taxAmount) : null,
      discount: dto.discount ? new Decimal(dto.discount) : null,
      discountType: dto.discountType || null,
      totalAmount: new Decimal(dto.totalAmount),
      notes: dto.notes || null,
      termsAndConditions: dto.termsAndConditions || null,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      status: 'DRAFT',
    });

    this.eventEmitter.emit('quotation.created', {
      quotationId: quotation.id,
      vendorAgreementId: dto.vendorAgreementId,
    });

    return quotation;
  }

  async findById(id: string): Promise<Quotation> {
    const quotation = await this.quotationRepository.findByIdWithRelations(id);
    if (!quotation) {
      throw new NotFoundException('Quotation not found');
    }
    return quotation;
  }

  async findByAgreement(vendorAgreementId: string): Promise<Quotation | null> {
    return this.quotationRepository.findByAgreement(vendorAgreementId);
  }

  async search(params: QuotationSearchDto) {
    return this.quotationRepository.findAll({
      vendorAgreementId: params.vendorAgreementId,
      activeEventId: params.activeEventId,
      status: params.status as QuotationStatus,
      page: params.page,
      limit: params.limit,
    });
  }

  async update(id: string, dto: UpdateQuotationDto): Promise<Quotation> {
    const quotation = await this.findById(id);

    // Only allow updates in DRAFT status
    if (quotation.status !== 'DRAFT') {
      throw new BadRequestException(
        'Can only update quotations in DRAFT status',
      );
    }

    const updateData: any = {};

    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.items !== undefined) updateData.items = dto.items as unknown as object;
    if (dto.subtotal !== undefined)
      updateData.subtotal = new Decimal(dto.subtotal);
    if (dto.taxRate !== undefined)
      updateData.taxRate = dto.taxRate ? new Decimal(dto.taxRate) : null;
    if (dto.taxAmount !== undefined)
      updateData.taxAmount = dto.taxAmount ? new Decimal(dto.taxAmount) : null;
    if (dto.discount !== undefined)
      updateData.discount = dto.discount ? new Decimal(dto.discount) : null;
    if (dto.discountType !== undefined)
      updateData.discountType = dto.discountType;
    if (dto.totalAmount !== undefined)
      updateData.totalAmount = new Decimal(dto.totalAmount);
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.termsAndConditions !== undefined)
      updateData.termsAndConditions = dto.termsAndConditions;
    if (dto.validUntil !== undefined)
      updateData.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;

    return this.quotationRepository.update(id, updateData);
  }

  async send(id: string, message?: string): Promise<Quotation> {
    const quotation = await this.findById(id);

    if (quotation.status !== 'DRAFT') {
      throw new BadRequestException('Can only send quotations in DRAFT status');
    }

    const updated = await this.quotationRepository.update(id, {
      status: 'SENT',
      sentAt: new Date(),
    });

    this.eventEmitter.emit('quotation.sent', {
      quotationId: id,
      vendorAgreementId: quotation.vendorAgreementId,
      message,
    });

    this.logger.log(`Quotation ${quotation.quotationNumber} sent`);

    return updated;
  }

  async accept(id: string): Promise<Quotation> {
    const quotation = await this.findById(id);

    if (quotation.status !== 'SENT') {
      throw new BadRequestException(
        'Can only accept quotations in SENT status',
      );
    }

    const updated = await this.quotationRepository.update(id, {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
    });

    this.eventEmitter.emit('quotation.accepted', {
      quotationId: id,
      vendorAgreementId: quotation.vendorAgreementId,
    });

    this.logger.log(`Quotation ${quotation.quotationNumber} accepted`);

    return updated;
  }

  async reject(id: string, reason?: string): Promise<Quotation> {
    const quotation = await this.findById(id);

    if (quotation.status !== 'SENT') {
      throw new BadRequestException(
        'Can only reject quotations in SENT status',
      );
    }

    const updated = await this.quotationRepository.update(id, {
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectionReason: reason || null,
    });

    this.eventEmitter.emit('quotation.rejected', {
      quotationId: id,
      vendorAgreementId: quotation.vendorAgreementId,
      reason,
    });

    this.logger.log(`Quotation ${quotation.quotationNumber} rejected`);

    return updated;
  }

  async convertToInvoice(id: string): Promise<{ quotation: Quotation; invoice: any }> {
    const quotation = await this.findById(id);

    if (quotation.status !== 'ACCEPTED') {
      throw new BadRequestException(
        'Can only convert ACCEPTED quotations to invoice',
      );
    }

    // Check if invoice already exists
    const existingInvoice = await this.invoiceService.findByAgreement(
      quotation.vendorAgreementId,
    );
    if (existingInvoice) {
      throw new ConflictException(
        'Invoice already exists for this agreement',
      );
    }

    // Create invoice from quotation
    const invoiceNumber = `INV-${Date.now()}`;
    const invoice = await this.invoiceService.create({
      vendorAgreementId: quotation.vendorAgreementId,
      invoiceNumber,
      amount: Number(quotation.totalAmount),
    });

    // Update quotation status to CONVERTED
    const updatedQuotation = await this.quotationRepository.update(id, {
      status: 'CONVERTED',
      invoice: { connect: { id: invoice.id } },
    });

    this.eventEmitter.emit('quotation.converted', {
      quotationId: id,
      invoiceId: invoice.id,
      vendorAgreementId: quotation.vendorAgreementId,
    });

    this.logger.log(
      `Quotation ${quotation.quotationNumber} converted to invoice ${invoiceNumber}`,
    );

    return { quotation: updatedQuotation, invoice };
  }

  async delete(id: string): Promise<void> {
    const quotation = await this.findById(id);

    if (quotation.status !== 'DRAFT') {
      throw new BadRequestException(
        'Can only delete quotations in DRAFT status',
      );
    }

    await this.quotationRepository.delete(id);

    this.eventEmitter.emit('quotation.deleted', {
      quotationId: id,
      vendorAgreementId: quotation.vendorAgreementId,
    });
  }

  async expireOutdatedQuotations(): Promise<number> {
    const expired = await this.quotationRepository.findExpiredQuotations();
    if (expired.length === 0) return 0;

    const ids = expired.map((q) => q.id);
    await this.quotationRepository.markAsExpired(ids);

    for (const quotation of expired) {
      this.eventEmitter.emit('quotation.expired', {
        quotationId: quotation.id,
        vendorAgreementId: quotation.vendorAgreementId,
      });
    }

    this.logger.log(`Expired ${ids.length} quotations`);
    return ids.length;
  }
}
