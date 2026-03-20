// ============================================================================
// KYC VERIFICATION SERVICE - Operations Domain
// ============================================================================

import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VendorKYC, KYCStatus } from '@prisma/client';
import { KycVerificationRepository } from '../repositories';

@Injectable()
export class KycVerificationService {
  private readonly logger = new Logger(KycVerificationService.name);

  constructor(
    private readonly kycRepository: KycVerificationRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(vendorProfileId: string): Promise<VendorKYC> {
    this.logger.log(`Creating KYC record for vendor: ${vendorProfileId}`);

    // Check if KYC already exists
    const existing =
      await this.kycRepository.findByVendorProfileId(vendorProfileId);
    if (existing) {
      throw new ConflictException('KYC record already exists for this vendor');
    }

    const kyc = await this.kycRepository.create({
      vendorProfile: { connect: { id: vendorProfileId } },
      legalName: 'Pending',
      businessType: 'OTHER',
      status: 'PENDING',
    });

    this.eventEmitter.emit('kyc.created', { kycId: kyc.id, vendorProfileId });
    return kyc;
  }

  async createWithDetails(
    vendorProfileId: string,
    details: { legalName: string; businessType: string; taxId?: string },
  ): Promise<VendorKYC> {
    this.logger.log(`Creating KYC record with details for vendor: ${vendorProfileId}`);

    // Check if KYC already exists
    const existing =
      await this.kycRepository.findByVendorProfileId(vendorProfileId);
    if (existing) {
      throw new ConflictException('KYC record already exists for this vendor');
    }

    const kyc = await this.kycRepository.create({
      vendorProfile: { connect: { id: vendorProfileId } },
      legalName: details.legalName,
      businessType: details.businessType,
      taxId: details.taxId,
      status: 'PENDING',
    });

    this.eventEmitter.emit('kyc.created', { kycId: kyc.id, vendorProfileId });
    return kyc;
  }

  async update(
    id: string,
    data: { legalName?: string; businessType?: string; taxId?: string },
  ): Promise<VendorKYC> {
    const kyc = await this.findById(id);

    if (kyc.status !== 'PENDING' && kyc.status !== 'REJECTED') {
      throw new ConflictException(
        'KYC can only be updated when in PENDING or REJECTED status',
      );
    }

    // If rejected, reset status to pending when updating
    const updateData: any = { ...data };
    if (kyc.status === 'REJECTED') {
      updateData.status = 'PENDING';
      updateData.rejectedAt = null;
      updateData.rejectionReason = null;
    }

    return this.kycRepository.update(id, updateData);
  }

  async findById(id: string): Promise<VendorKYC> {
    const kyc = await this.kycRepository.findById(id, {
      documents: true,
      vendorProfile: {
        select: {
          id: true,
          businessName: true,
          slug: true,
          contactEmail: true,
          status: true,
        },
      },
    });
    if (!kyc) {
      throw new NotFoundException('KYC record not found');
    }
    return kyc;
  }

  async findByVendorProfile(
    vendorProfileId: string,
  ): Promise<VendorKYC | null> {
    return this.kycRepository.findByVendorProfileId(vendorProfileId);
  }

  async findAll(options?: {
    status?: KYCStatus | KYCStatus[];
    skip?: number;
    take?: number;
  }) {
    this.logger.log(`Finding all KYC records with options: ${JSON.stringify(options)}`);
    const records = await this.kycRepository.findAll(options);
    this.logger.log(`Found ${records?.length ?? 0} KYC records`);
    return records || [];
  }

  async findByStatus(status: KYCStatus) {
    return this.kycRepository.findByStatus(status);
  }

  async submit(id: string): Promise<VendorKYC> {
    const kyc = await this.findById(id);

    if (kyc.status !== 'PENDING') {
      throw new ConflictException(
        'KYC can only be submitted when in PENDING status',
      );
    }

    const updated = await this.kycRepository.update(id, {
      status: 'SUBMITTED',
      submittedAt: new Date(),
    });

    this.eventEmitter.emit('kyc.submitted', {
      kycId: id,
      vendorProfileId: kyc.vendorProfileId,
    });
    return updated;
  }

  async startReview(id: string, reviewerId: string): Promise<VendorKYC> {
    const kyc = await this.findById(id);

    if (kyc.status !== 'SUBMITTED') {
      throw new ConflictException(
        'KYC must be submitted before review can start',
      );
    }

    return this.kycRepository.update(id, {
      status: 'UNDER_REVIEW',
      reviewerId,
      reviewedAt: new Date(),
    });
  }

  async approve(
    id: string,
    reviewerId: string,
    expiryDate?: Date,
  ): Promise<VendorKYC> {
    const kyc = await this.findById(id);

    const updated = await this.kycRepository.update(id, {
      status: 'APPROVED',
      reviewerId,
      reviewedAt: new Date(),
      approvedAt: new Date(),
      expiryDate: expiryDate || this.getDefaultExpiryDate(),
    });

    this.eventEmitter.emit('kyc.approved', {
      kycId: id,
      vendorProfileId: kyc.vendorProfileId,
      approvedBy: reviewerId,
      approvedAt: updated.approvedAt,
      legalName: kyc.legalName,
    });
    return updated;
  }

  private getDefaultExpiryDate(): Date {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1); // Default 1 year expiry
    return date;
  }

  async reject(
    id: string,
    reviewerId: string,
    rejectionReason: string,
  ): Promise<VendorKYC> {
    const kyc = await this.findById(id);

    const updated = await this.kycRepository.update(id, {
      status: 'REJECTED',
      reviewerId,
      reviewedAt: new Date(),
      rejectedAt: new Date(),
      rejectionReason,
    });

    this.eventEmitter.emit('kyc.rejected', {
      kycId: id,
      vendorProfileId: kyc.vendorProfileId,
      rejectedBy: reviewerId,
      rejectedAt: updated.rejectedAt,
      legalName: kyc.legalName,
      rejectionReason,
    });
    return updated;
  }

  async getPendingCount(): Promise<number> {
    return this.kycRepository.getPendingCount();
  }

  async getExpiringSoon(daysThreshold: number = 30) {
    return this.kycRepository.getExpiringSoon(daysThreshold);
  }
}
