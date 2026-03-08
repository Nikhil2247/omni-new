// ============================================================================
// VENDOR AGREEMENT SERVICE - Operations Domain
// ============================================================================

import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VendorAgreement } from '@prisma/client';

import { ProvisionalInvoiceService } from './provisional-invoice.service';
import type { Prisma } from '@prisma/client';
import { VendorAgreementRepository } from '../repositories';
import { CreateVendorAgreementDto, UpdateVendorAgreementDto } from '../dto';
import { Decimal } from '@prisma/client/runtime/client';

@Injectable()
export class VendorAgreementService {
  private readonly logger = new Logger(VendorAgreementService.name);

  constructor(
    private readonly vendorAgreementRepository: VendorAgreementRepository,
    private readonly invoiceService: ProvisionalInvoiceService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateVendorAgreementDto): Promise<VendorAgreement> {
    this.logger.log(
      `Creating vendor agreement for event: ${dto.activeEventId}`,
    );

    const agreement = await this.vendorAgreementRepository.create({
      activeEvent: { connect: { id: dto.activeEventId } },
      requirementItem: dto.requirementItemId
        ? { connect: { id: dto.requirementItemId } }
        : undefined,
      vendorProfileId: dto.vendorProfileId,
      vendorName: dto.vendorName,
      agreedAmount: new Decimal(dto.agreedAmount),
      advancePaid: new Decimal(dto.advancePaid ?? 0),
      balanceDue: new Decimal(dto.agreedAmount - (dto.advancePaid ?? 0)),
      status: 'DRAFT',
      // specialRequirements: dto.specialRequirements, // Field does not exist in schema
    });

    this.eventEmitter.emit('vendor-agreement.created', {
      agreementId: agreement.id,
      activeEventId: dto.activeEventId,
    });

    return agreement;
  }

  async findByVendor(vendorProfileId: string): Promise<VendorAgreement[]> {
    this.logger.log(`Finding agreements for vendor: ${vendorProfileId}`);
    return this.vendorAgreementRepository.findByVendor(vendorProfileId);
  }

  async findById(id: string): Promise<VendorAgreement> {
    const agreement = await this.vendorAgreementRepository.findById(id, {
      invoice: true,
      requirementItem: true,
    });
    if (!agreement) {
      throw new NotFoundException('Vendor agreement not found');
    }
    return agreement;
  }

  async findByActiveEvent(activeEventId: string) {
    return this.vendorAgreementRepository.findByActiveEvent(activeEventId);
  }

  async update(
    id: string,
    dto: UpdateVendorAgreementDto,
  ): Promise<VendorAgreement> {
    const existing = await this.findById(id);

    if (existing.status === 'CONTRACT_LOCKED') {
      throw new ConflictException('Cannot update a locked agreement');
    }

    const agreedAmount =
      dto.agreedAmount !== undefined
        ? new Decimal(dto.agreedAmount)
        : undefined;
    const advancePaid =
      dto.advancePaid !== undefined ? new Decimal(dto.advancePaid) : undefined;
    const balanceDue =
      agreedAmount || advancePaid
        ? new Decimal(dto.agreedAmount ?? Number(existing.agreedAmount)).minus(
            dto.advancePaid ?? Number(existing.advancePaid),
          )
        : undefined;

    const updated = await this.vendorAgreementRepository.update(id, {
      agreedAmount,
      advancePaid,
      balanceDue: balanceDue ?? undefined,
      // specialRequirements: dto.specialRequirements, // Field does not exist in schema
      status: dto.status as any,
      // signedByVendor: dto.signedByVendor, // Field does not exist in schema
      // signedByOps: dto.signedByOps, // Field does not exist in schema
      // ...(dto.signedByVendor && dto.signedByOps ? { status: 'CONTRACT_LOCKED', lockedAt: new Date() } : {}),
    });

    if (updated.status === 'CONTRACT_LOCKED' && !(existing as any).invoice) {
      await this.invoiceService.createForAgreement(
        updated.id,
        Number(updated.balanceDue),
      );
    }

    this.eventEmitter.emit('vendor-agreement.updated', {
      agreementId: id,
      oldStatus: existing.status,
      newStatus: updated.status,
    });
    return updated;
  }

  async markAsSent(id: string): Promise<VendorAgreement> {
    const existing = await this.findById(id);
    if (existing.status === 'SENT') {
      return existing;
    }
    const updated = await this.vendorAgreementRepository.update(id, {
      status: 'SENT',
      sentAt: new Date(),
    });
    this.eventEmitter.emit('vendor-agreement.updated', {
      agreementId: id,
      oldStatus: existing.status,
      newStatus: updated.status,
    });
    return updated;
  }

  async markAsAccepted(id: string): Promise<VendorAgreement> {
    const existing = await this.findById(id);
    if (existing.status === 'ACCEPTED') {
      return existing;
    }
    const updated = await this.vendorAgreementRepository.update(id, {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
    });
    this.eventEmitter.emit('vendor-agreement.updated', {
      agreementId: id,
      oldStatus: existing.status,
      newStatus: updated.status,
    });
    return updated;
  }

  async markAsDeclined(id: string, reason?: string): Promise<VendorAgreement> {
    const existing = await this.findById(id);
    if (existing.status === 'DECLINED' && existing.declineReason === reason) {
      return existing;
    }
    const updated = await this.vendorAgreementRepository.update(id, {
      status: 'DECLINED',
      declinedAt: new Date(),
      declineReason: reason,
    });
    this.eventEmitter.emit('vendor-agreement.updated', {
      agreementId: id,
      oldStatus: existing.status,
      newStatus: updated.status,
    });
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.vendorAgreementRepository.delete(id);
    this.eventEmitter.emit('vendor-agreement.deleted', { agreementId: id });
  }
}
