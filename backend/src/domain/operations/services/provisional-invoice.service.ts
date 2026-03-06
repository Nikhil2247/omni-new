// ============================================================================
// PROVISIONAL INVOICE SERVICE - Operations Domain
// ============================================================================

import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProvisionalInvoice } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { ProvisionalInvoiceRepository } from '../repositories';
import {
  CreateProvisionalInvoiceDto,
  UpdateProvisionalInvoiceDto,
} from '../dto';
import { Decimal } from '@prisma/client/runtime/client';

@Injectable()
export class ProvisionalInvoiceService {
  private readonly logger = new Logger(ProvisionalInvoiceService.name);

  constructor(
    private readonly invoiceRepository: ProvisionalInvoiceRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateProvisionalInvoiceDto): Promise<ProvisionalInvoice> {
    this.logger.log(
      `Creating provisional invoice for agreement: ${dto.vendorAgreementId}`,
    );

    const existing = await this.invoiceRepository.findByAgreement(
      dto.vendorAgreementId,
    );
    if (existing) {
      throw new ConflictException('Invoice already exists for this agreement');
    }

    const invoice = await this.invoiceRepository.create({
      vendorAgreement: { connect: { id: dto.vendorAgreementId } },
      invoiceNumber: dto.invoiceNumber,
      amount: new Decimal(dto.amount),
      status: 'PENDING',
    });

    this.eventEmitter.emit('invoice.created', {
      invoiceId: invoice.id,
      vendorAgreementId: dto.vendorAgreementId,
    });
    return invoice;
  }

  async createForAgreement(
    vendorAgreementId: string,
    amount: number,
  ): Promise<ProvisionalInvoice> {
    const invoiceNumber = `INV-${Date.now()}`;
    return this.create({ vendorAgreementId, invoiceNumber, amount });
  }

  async findById(id: string): Promise<ProvisionalInvoice> {
    const invoice = await this.invoiceRepository.findById(id);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  async findByAgreement(
    vendorAgreementId: string,
  ): Promise<ProvisionalInvoice | null> {
    return this.invoiceRepository.findByAgreement(vendorAgreementId);
  }

  async findAll(params?: { status?: string; activeEventId?: string; page?: number; limit?: number }) {
    return this.invoiceRepository.findAll({
      status: params?.status as any,
      activeEventId: params?.activeEventId,
      page: params?.page,
      limit: params?.limit,
    });
  }

  async update(
    id: string,
    dto: UpdateProvisionalInvoiceDto,
  ): Promise<ProvisionalInvoice> {
    await this.findById(id);

    return this.invoiceRepository.update(id, {
      status: dto.status,
      paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
    });
  }

  async markAsPaid(id: string): Promise<ProvisionalInvoice> {
    return this.update(id, {
      status: 'PAID' as any,
      paidAt: new Date().toISOString(),
    });
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.invoiceRepository.delete(id);
    this.eventEmitter.emit('invoice.deleted', { invoiceId: id });
  }
}
