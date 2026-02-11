// ============================================================================
// KYC VERIFICATION SERVICE - Operations Domain
// ============================================================================

import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { VendorKYC, KYCStatus } from '@prisma/client'
import { KycVerificationRepository } from '../repositories'


@Injectable()
export class KycVerificationService {
  private readonly logger = new Logger(KycVerificationService.name)

  constructor(
    private readonly kycRepository: KycVerificationRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(vendorProfileId: string): Promise<VendorKYC> {
    this.logger.log(`Creating KYC record for vendor: ${vendorProfileId}`)

    // Check if KYC already exists
    const existing = await this.kycRepository.findByVendorProfileId(vendorProfileId)
    if (existing) {
      throw new ConflictException('KYC record already exists for this vendor')
    }

    const kyc = await this.kycRepository.create({
      vendorProfile: { connect: { id: vendorProfileId } },
      legalName: 'Pending',
      businessType: 'OTHER',
      status: 'PENDING',
    })

    this.eventEmitter.emit('kyc.created', { kycId: kyc.id, vendorProfileId })
    return kyc
  }

  async findById(id: string): Promise<VendorKYC> {
    const kyc = await this.kycRepository.findById(id, { documents: true })
    if (!kyc) {
      throw new NotFoundException('KYC record not found')
    }
    return kyc
  }

  async findByVendorProfile(vendorProfileId: string): Promise<VendorKYC | null> {
    return this.kycRepository.findByVendorProfileId(vendorProfileId)
  }

  async findByStatus(status: KYCStatus) {
    return this.kycRepository.findByStatus(status)
  }

  async submit(id: string): Promise<VendorKYC> {
    const kyc = await this.findById(id)

    if (kyc.status !== 'PENDING') {
      throw new ConflictException('KYC can only be submitted when in PENDING status')
    }

    const updated = await this.kycRepository.update(id, {
      status: 'SUBMITTED',
      submittedAt: new Date(),
    })

    this.eventEmitter.emit('kyc.submitted', { kycId: id, vendorProfileId: kyc.vendorProfileId })
    return updated
  }

  async startReview(id: string, reviewerId: string): Promise<VendorKYC> {
    const kyc = await this.findById(id)

    if (kyc.status !== 'SUBMITTED') {
      throw new ConflictException('KYC must be submitted before review can start')
    }

    return this.kycRepository.update(id, {
      status: 'UNDER_REVIEW',
      // reviewerId, // Field doesn't exist
    })
  }

  async approve(id: string, reviewerId: string, expiryDate?: Date): Promise<VendorKYC> {
    const kyc = await this.findById(id)

    const updated = await this.kycRepository.update(id, {
      status: 'APPROVED',
      // reviewerId, // Field doesn't exist
      // reviewedAt: new Date(), // Field does not exist in schema
      approvedAt: new Date(),
      // expiryDate, // Field does not exist in schema
    })

    this.eventEmitter.emit('kyc.approved', { kycId: id, vendorProfileId: kyc.vendorProfileId })
    return updated
  }

  async reject(id: string, reviewerId: string, rejectionReason: string): Promise<VendorKYC> {
    const kyc = await this.findById(id)

    const updated = await this.kycRepository.update(id, {
      status: 'REJECTED',
      // reviewerId, // Field doesn't exist
      // reviewedAt: new Date(), // Field does not exist in schema
      rejectionReason,
    })

    this.eventEmitter.emit('kyc.rejected', {
      kycId: id,
      vendorProfileId: kyc.vendorProfileId,
      reason: rejectionReason,
    })
    return updated
  }

  async getPendingCount(): Promise<number> {
    return this.kycRepository.getPendingCount()
  }

  async getExpiringSoon(daysThreshold: number = 30) {
    return this.kycRepository.getExpiringSoon(daysThreshold)
  }
}


