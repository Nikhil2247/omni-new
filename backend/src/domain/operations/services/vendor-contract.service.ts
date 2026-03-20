// ============================================================================
// VENDOR CONTRACT SERVICE - Operations Domain
// ============================================================================
// Manages platform-vendor onboarding contracts, commission terms, and signing

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  VendorContract,
  ContractStatus,
  PayoutFrequency,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';

export interface CreateContractDto {
  vendorProfileId: string;
  commissionRate: number;
  minCommission?: number;
  maxCommission?: number;
  payoutFrequency?: PayoutFrequency;
  payoutHoldDays?: number;
  minPayoutAmount?: number;
  effectiveDate?: Date;
  expiryDate?: Date;
}

export interface AmendContractDto {
  amendmentType: string;
  description: string;
  previousValue: string;
  newValue: string;
}

export interface UpdateContractDto {
  commissionRate?: number;
  minCommission?: number;
  maxCommission?: number;
  payoutFrequency?: PayoutFrequency;
  payoutHoldDays?: number;
  minPayoutAmount?: number;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankName?: string;
  upiId?: string;
}

export interface UpdateBankDetailsDto {
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankName?: string;
  upiId?: string;
}

export interface SignContractDto {
  signedByVendor?: boolean;
  signedByPlatform?: boolean;
  vendorSignatureIp?: string;
  contractDocUrl?: string;
}

@Injectable()
export class VendorContractService {
  private readonly logger = new Logger(VendorContractService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Generate a unique contract number
   */
  private async generateContractNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.vendorContract.count({
      where: {
        contractNumber: {
          startsWith: `VC-${year}`,
        },
      },
    });
    return `VC-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  /**
   * Create a new vendor contract
   */
  async create(dto: CreateContractDto): Promise<VendorContract> {
    this.logger.log(`Creating contract for vendor: ${dto.vendorProfileId}`);

    // Check if contract already exists for this vendor
    const existing = await this.prisma.vendorContract.findUnique({
      where: { vendorProfileId: dto.vendorProfileId },
    });

    if (existing) {
      throw new ConflictException('Contract already exists for this vendor');
    }

    // Validate commission rate
    if (dto.commissionRate < 0 || dto.commissionRate > 100) {
      throw new BadRequestException('Commission rate must be between 0 and 100');
    }

    const contractNumber = await this.generateContractNumber();

    const contract = await this.prisma.vendorContract.create({
      data: {
        vendorProfileId: dto.vendorProfileId,
        contractNumber,
        commissionRate: dto.commissionRate,
        minCommission: dto.minCommission,
        maxCommission: dto.maxCommission,
        payoutFrequency: dto.payoutFrequency || PayoutFrequency.AFTER_EVENT,
        payoutHoldDays: dto.payoutHoldDays || 7,
        minPayoutAmount: dto.minPayoutAmount || 500,
        status: ContractStatus.DRAFT,
        startDate: new Date(),
        termsVersion: '1.0',
      },
    });

    this.eventEmitter.emit('contract.created', {
      contractId: contract.id,
      vendorProfileId: dto.vendorProfileId,
      commissionRate: dto.commissionRate,
    });

    return contract;
  }

  /**
   * Find contract by ID
   */
  async findById(id: string): Promise<VendorContract> {
    const contract = await this.prisma.vendorContract.findUnique({
      where: { id },
      include: {
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            contactEmail: true,
          },
        },
        amendments: {
          orderBy: { amendmentNumber: 'desc' },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return contract;
  }

  /**
   * Find contract by vendor profile ID
   */
  async findByVendorProfile(vendorProfileId: string): Promise<VendorContract | null> {
    return this.prisma.vendorContract.findUnique({
      where: { vendorProfileId },
      include: {
        amendments: {
          orderBy: { amendmentNumber: 'desc' },
        },
      },
    });
  }

  /**
   * Update contract details
   */
  async update(id: string, dto: UpdateContractDto): Promise<VendorContract> {
    const contract = await this.findById(id);

    // Only allow updates to DRAFT or PENDING_SIGNATURE contracts
    if (
      contract.status !== ContractStatus.DRAFT &&
      contract.status !== ContractStatus.PENDING_SIGNATURE
    ) {
      throw new BadRequestException(
        'Cannot update contract that is already active or terminated',
      );
    }

    if (dto.commissionRate !== undefined) {
      if (dto.commissionRate < 0 || dto.commissionRate > 100) {
        throw new BadRequestException('Commission rate must be between 0 and 100');
      }
    }

    return this.prisma.vendorContract.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Update bank and payout details for a vendor contract.
   * Vendors can update payout details after activation, but not once terminated.
   */
  async updateBankDetails(
    id: string,
    dto: UpdateBankDetailsDto,
  ): Promise<VendorContract> {
    const contract = await this.findById(id);

    if (contract.status === ContractStatus.TERMINATED) {
      throw new BadRequestException(
        'Cannot update bank details for a terminated contract',
      );
    }

    return this.prisma.vendorContract.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Send contract to vendor for signing
   */
  async sendForSignature(id: string, contractDocUrl: string): Promise<VendorContract> {
    const contract = await this.findById(id);

    if (contract.status !== ContractStatus.DRAFT) {
      throw new BadRequestException('Contract must be in DRAFT status to send for signature');
    }

    const updated = await this.prisma.vendorContract.update({
      where: { id },
      data: {
        status: ContractStatus.PENDING_SIGNATURE,
        contractDocUrl,
      },
    });

    this.eventEmitter.emit('contract.sent_for_signature', {
      contractId: id,
      vendorProfileId: contract.vendorProfileId,
    });

    return updated;
  }

  /**
   * Sign contract (by vendor or platform)
   */
  async sign(id: string, dto: SignContractDto): Promise<VendorContract> {
    const contract = await this.findById(id);

    if (contract.status !== ContractStatus.PENDING_SIGNATURE) {
      throw new BadRequestException('Contract must be pending signature');
    }

    const updateData: Prisma.VendorContractUpdateInput = {};

    if (dto.signedByVendor) {
      updateData.signedByVendor = true;
      updateData.vendorSignatureIp = dto.vendorSignatureIp;
      updateData.signedAt = new Date();
    }

    if (dto.signedByPlatform) {
      updateData.signedByPlatform = true;
    }

    if (dto.contractDocUrl) {
      updateData.contractDocUrl = dto.contractDocUrl;
    }

    const updated = await this.prisma.vendorContract.update({
      where: { id },
      data: updateData,
    });

    // Check if both parties have signed
    if (updated.signedByVendor && updated.signedByPlatform) {
      return this.activate(id);
    }

    return updated;
  }

  /**
   * Activate contract after both parties sign
   */
  async activate(id: string): Promise<VendorContract> {
    const contract = await this.findById(id);

    if (!contract.signedByVendor || !contract.signedByPlatform) {
      throw new BadRequestException('Both parties must sign before activation');
    }

    const effectiveDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year contract

    const updated = await this.prisma.vendorContract.update({
      where: { id },
      data: {
        status: ContractStatus.ACTIVE,
        effectiveDate,
        expiryDate,
      },
    });

    this.eventEmitter.emit('contract.activated', {
      contractId: id,
      vendorProfileId: contract.vendorProfileId,
      commissionRate: contract.commissionRate,
      effectiveDate,
    });

    return updated;
  }

  /**
   * Suspend contract
   */
  async suspend(id: string, reason: string): Promise<VendorContract> {
    const contract = await this.findById(id);

    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException('Only active contracts can be suspended');
    }

    const updated = await this.prisma.vendorContract.update({
      where: { id },
      data: {
        status: ContractStatus.SUSPENDED,
        terminationReason: reason,
      },
    });

    this.eventEmitter.emit('contract.suspended', {
      contractId: id,
      vendorProfileId: contract.vendorProfileId,
      reason,
    });

    return updated;
  }

  /**
   * Terminate contract
   */
  async terminate(id: string, reason: string): Promise<VendorContract> {
    const contract = await this.findById(id);

    if (
      contract.status !== ContractStatus.ACTIVE &&
      contract.status !== ContractStatus.SUSPENDED
    ) {
      throw new BadRequestException('Contract must be active or suspended to terminate');
    }

    const updated = await this.prisma.vendorContract.update({
      where: { id },
      data: {
        status: ContractStatus.TERMINATED,
        terminatedAt: new Date(),
        terminationReason: reason,
      },
    });

    this.eventEmitter.emit('contract.terminated', {
      contractId: id,
      vendorProfileId: contract.vendorProfileId,
      reason,
    });

    return updated;
  }

  /**
   * Create contract amendment (rate change, etc.)
   */
  async createAmendment(
    contractId: string,
    newRate: number,
    changeDescription: string,
    effectiveDate: Date,
  ) {
    const contract = await this.findById(contractId);

    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException('Only active contracts can be amended');
    }

    // Get next amendment number
    const lastAmendment = await this.prisma.contractAmendment.findFirst({
      where: { contractId },
      orderBy: { amendmentNumber: 'desc' },
    });

    const amendmentNumber = (lastAmendment?.amendmentNumber || 0) + 1;

    const amendment = await this.prisma.contractAmendment.create({
      data: {
        contractId,
        amendmentNumber,
        previousRate: contract.commissionRate,
        newRate,
        description: changeDescription,
        effectiveDate,
      },
    });

    return amendment;
  }

  /**
   * Get contracts by status
   */
  async findByStatus(status: ContractStatus) {
    return this.prisma.vendorContract.findMany({
      where: { status },
      include: {
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get expiring contracts
   */
  async getExpiringSoon(daysThreshold: number = 30) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    return this.prisma.vendorContract.findMany({
      where: {
        status: ContractStatus.ACTIVE,
        expiryDate: {
          lte: thresholdDate,
          gte: new Date(),
        },
      },
      include: {
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
            contactEmail: true,
          },
        },
      },
    });
  }

  /**
   * Get all contracts with optional status filter
   */
  async findAll(status?: ContractStatus) {
    const where = status ? { status } : {};

    return this.prisma.vendorContract.findMany({
      where,
      include: {
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            contactEmail: true,
          },
        },
        amendments: {
          orderBy: { amendmentNumber: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Reactivate a suspended contract
   */
  async reactivate(id: string): Promise<VendorContract> {
    const contract = await this.findById(id);

    if (contract.status !== ContractStatus.SUSPENDED) {
      throw new BadRequestException('Only suspended contracts can be reactivated');
    }

    const updated = await this.prisma.vendorContract.update({
      where: { id },
      data: {
        status: ContractStatus.ACTIVE,
        terminationReason: null,
      },
    });

    this.eventEmitter.emit('contract.reactivated', {
      contractId: id,
      vendorProfileId: contract.vendorProfileId,
    });

    return updated;
  }

  /**
   * Add amendment to contract (admin interface)
   */
  async addAmendment(contractId: string, dto: AmendContractDto) {
    const contract = await this.findById(contractId);

    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException('Only active contracts can be amended');
    }

    // Get next amendment number
    const lastAmendment = await this.prisma.contractAmendment.findFirst({
      where: { contractId },
      orderBy: { amendmentNumber: 'desc' },
    });

    const amendmentNumber = (lastAmendment?.amendmentNumber || 0) + 1;

    // Parse numeric values if the amendment is for rates
    let previousRate: number | null = null;
    let newRate: number | null = null;

    if (dto.amendmentType === 'RATE_CHANGE') {
      previousRate = parseFloat(dto.previousValue) || null;
      newRate = parseFloat(dto.newValue) || null;
    }

    const amendment = await this.prisma.contractAmendment.create({
      data: {
        contractId,
        amendmentNumber,
        previousRate,
        newRate,
        description: `${dto.amendmentType}: ${dto.description}`,
        effectiveDate: new Date(),
      },
    });

    // If rate change, update the contract rate
    if (dto.amendmentType === 'RATE_CHANGE' && newRate !== null) {
      await this.prisma.vendorContract.update({
        where: { id: contractId },
        data: { commissionRate: newRate },
      });
    }

    return amendment;
  }

  /**
   * Get all amendments for a contract
   */
  async getAmendments(contractId: string) {
    // Verify contract exists
    await this.findById(contractId);

    return this.prisma.contractAmendment.findMany({
      where: { contractId },
      orderBy: { amendmentNumber: 'desc' },
    });
  }

  /**
   * Get or create a contract for a vendor (for onboarding flow)
   * Auto-creates with default terms and marks as ready for vendor signature
   */
  async getOrCreateForVendor(vendorProfileId: string): Promise<VendorContract> {
    this.logger.log(`Getting or creating contract for vendor: ${vendorProfileId}`);

    // Check if contract already exists
    const existing = await this.prisma.vendorContract.findUnique({
      where: { vendorProfileId },
      include: {
        amendments: {
          orderBy: { amendmentNumber: 'desc' },
        },
      },
    });

    if (existing) {
      return existing;
    }

    // Create new contract with default terms
    const contractNumber = await this.generateContractNumber();
    const defaultCommissionRate = 10.0; // 10% default commission

    const contract = await this.prisma.vendorContract.create({
      data: {
        vendorProfileId,
        contractNumber,
        commissionRate: defaultCommissionRate,
        minCommission: null,
        maxCommission: null,
        payoutFrequency: PayoutFrequency.AFTER_EVENT,
        payoutHoldDays: 7,
        minPayoutAmount: 500,
        status: ContractStatus.PENDING_SIGNATURE,
        signedByPlatform: true, // Platform pre-signs
        startDate: new Date(),
        termsVersion: '1.0',
      },
      include: {
        amendments: true,
      },
    });

    this.logger.log(`Created contract ${contractNumber} for vendor ${vendorProfileId}`);

    this.eventEmitter.emit('contract.created', {
      contractId: contract.id,
      vendorProfileId,
      commissionRate: defaultCommissionRate,
    });

    return contract;
  }

  /**
   * Sign contract by vendor (simplified flow for onboarding)
   * Only requires vendor signature since platform pre-signs
   */
  async signByVendor(
    contractId: string,
    vendorSignatureIp: string,
  ): Promise<VendorContract> {
    const contract = await this.findById(contractId);

    if (contract.signedByVendor) {
      throw new BadRequestException('Contract already signed by vendor');
    }

    if (contract.status !== ContractStatus.PENDING_SIGNATURE) {
      throw new BadRequestException('Contract is not pending signature');
    }

    const effectiveDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year contract

    const updated = await this.prisma.vendorContract.update({
      where: { id: contractId },
      data: {
        signedByVendor: true,
        vendorSignatureIp,
        signedAt: new Date(),
        status: ContractStatus.ACTIVE,
        effectiveDate,
        expiryDate,
      },
      include: {
        amendments: true,
      },
    });

    this.logger.log(`Vendor signed contract ${contractId}, now ACTIVE`);

    this.eventEmitter.emit('contract.activated', {
      contractId,
      vendorProfileId: contract.vendorProfileId,
      commissionRate: contract.commissionRate,
      effectiveDate,
    });

    return updated;
  }

  /**
   * Get contract terms for display (without sensitive bank details)
   */
  getContractTermsDisplay(contract: VendorContract) {
    return {
      contractNumber: contract.contractNumber,
      commissionRate: contract.commissionRate,
      payoutFrequency: contract.payoutFrequency,
      payoutHoldDays: contract.payoutHoldDays,
      minPayoutAmount: contract.minPayoutAmount,
      minCommission: contract.minCommission,
      maxCommission: contract.maxCommission,
      status: contract.status,
      effectiveDate: contract.effectiveDate,
      expiryDate: contract.expiryDate,
      signedByVendor: contract.signedByVendor,
      signedByPlatform: contract.signedByPlatform,
      signedAt: contract.signedAt,
      version: contract.version,
    };
  }
}
