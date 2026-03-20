// ============================================================================
// CONSENT SERVICE - Operations Domain
// ============================================================================
// Manages user and vendor consents for legal compliance

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  ConsentType,
  UserConsent,
  VendorConsent,
  ConsentDefinition,
} from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';

export interface GiveConsentDto {
  consentType: ConsentType;
  version: string;
  documentUrl?: string;
  ipAddress?: string;
  userAgent?: string;
  source?: string;
}

export interface ConsentStatus {
  consentType: ConsentType;
  hasConsent: boolean;
  version?: string;
  givenAt?: Date;
  withdrawnAt?: Date | null;
}

@Injectable()
export class ConsentService {
  private readonly logger = new Logger(ConsentService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // USER CONSENTS
  // ============================================================================

  /**
   * Record user consent
   */
  async giveUserConsent(userId: string, dto: GiveConsentDto): Promise<UserConsent> {
    this.logger.log(`Recording consent ${dto.consentType} for user ${userId}`);

    // First, find the consent definition
    const consentDefinition = await this.prisma.consentDefinition.findFirst({
      where: {
        type: dto.consentType,
        version: dto.version,
      },
    });

    if (!consentDefinition) {
      throw new NotFoundException(`Consent definition not found for type ${dto.consentType} version ${dto.version}`);
    }

    // Upsert - update if exists for same user+consentType+version, create otherwise
    return this.prisma.userConsent.upsert({
      where: {
        userId_consentType_version: {
          userId,
          consentType: dto.consentType,
          version: dto.version,
        },
      },
      update: {
        givenAt: new Date(),
        withdrawnAt: null, // Re-consent clears withdrawal
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        source: dto.source,
        documentUrl: dto.documentUrl,
      },
      create: {
        user: { connect: { id: userId } },
        consentType: dto.consentType,
        version: dto.version,
        documentUrl: dto.documentUrl,
        givenAt: new Date(),
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        source: dto.source,
      },
    });
  }

  /**
   * Withdraw user consent
   */
  async withdrawUserConsent(
    userId: string,
    consentType: ConsentType,
    version: string,
  ): Promise<UserConsent> {
    this.logger.log(`Withdrawing consent ${consentType} for user ${userId}`);

    const consent = await this.prisma.userConsent.findUnique({
      where: {
        userId_consentType_version: {
          userId,
          consentType,
          version,
        },
      },
    });

    if (!consent) {
      throw new NotFoundException('Consent record not found');
    }

    return this.prisma.userConsent.update({
      where: { id: consent.id },
      data: { withdrawnAt: new Date() },
    });
  }

  /**
   * Get all consents for a user
   */
  async getUserConsents(userId: string): Promise<UserConsent[]> {
    return this.prisma.userConsent.findMany({
      where: { userId },
      orderBy: { givenAt: 'desc' },
    });
  }

  /**
   * Get active consents for a user (not withdrawn)
   */
  async getActiveUserConsents(userId: string): Promise<UserConsent[]> {
    return this.prisma.userConsent.findMany({
      where: {
        userId,
        withdrawnAt: null,
      },
      orderBy: { givenAt: 'desc' },
    });
  }

  /**
   * Check if user has given a specific consent
   */
  async hasUserConsent(
    userId: string,
    consentType: ConsentType,
    version?: string,
  ): Promise<boolean> {
    const where: any = {
      userId,
      consentType,
      withdrawnAt: null,
    };

    if (version) {
      where.version = version;
    }

    const consent = await this.prisma.userConsent.findFirst({ where });
    return !!consent;
  }

  /**
   * Get user consent status for all types
   */
  async getUserConsentStatus(userId: string): Promise<ConsentStatus[]> {
    const consents = await this.getActiveUserConsents(userId);
    const consentTypes = Object.values(ConsentType);

    return consentTypes.map((type) => {
      const consent = consents.find((c) => c.consentType === type);
      return {
        consentType: type,
        hasConsent: !!consent,
        version: consent?.version ?? undefined,
        givenAt: consent?.givenAt ?? undefined,
        withdrawnAt: consent?.withdrawnAt ?? undefined,
      };
    });
  }

  /**
   * Bulk record user consents (for registration)
   */
  async giveUserConsentsBulk(
    userId: string,
    consents: GiveConsentDto[],
  ): Promise<UserConsent[]> {
    const results: UserConsent[] = [];

    for (const dto of consents) {
      const consent = await this.giveUserConsent(userId, dto);
      results.push(consent);
    }

    return results;
  }

  // ============================================================================
  // VENDOR CONSENTS
  // ============================================================================

  /**
   * Record vendor consent
   */
  async giveVendorConsent(
    vendorProfileId: string,
    dto: GiveConsentDto,
  ): Promise<VendorConsent> {
    this.logger.log(`Recording consent ${dto.consentType} for vendor ${vendorProfileId}`);

    // First, find the consent definition
    const consentDefinition = await this.prisma.consentDefinition.findFirst({
      where: {
        type: dto.consentType,
        version: dto.version,
      },
    });

    if (!consentDefinition) {
      throw new NotFoundException(`Consent definition not found for type ${dto.consentType} version ${dto.version}`);
    }

    return this.prisma.vendorConsent.upsert({
      where: {
        vendorProfileId_consentType_version: {
          vendorProfileId,
          consentType: dto.consentType,
          version: dto.version,
        },
      },
      update: {
        givenAt: new Date(),
        withdrawnAt: null,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        source: dto.source,
        documentUrl: dto.documentUrl,
      },
      create: {
        vendorProfile: { connect: { id: vendorProfileId } },
        consentType: dto.consentType,
        version: dto.version,
        documentUrl: dto.documentUrl,
        givenAt: new Date(),
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        source: dto.source,
      },
    });
  }

  /**
   * Withdraw vendor consent
   */
  async withdrawVendorConsent(
    vendorProfileId: string,
    consentType: ConsentType,
    version: string,
  ): Promise<VendorConsent> {
    this.logger.log(`Withdrawing consent ${consentType} for vendor ${vendorProfileId}`);

    const consent = await this.prisma.vendorConsent.findUnique({
      where: {
        vendorProfileId_consentType_version: {
          vendorProfileId,
          consentType,
          version,
        },
      },
    });

    if (!consent) {
      throw new NotFoundException('Consent record not found');
    }

    return this.prisma.vendorConsent.update({
      where: { id: consent.id },
      data: { withdrawnAt: new Date() },
    });
  }

  /**
   * Get all consents for a vendor
   */
  async getVendorConsents(vendorProfileId: string): Promise<VendorConsent[]> {
    return this.prisma.vendorConsent.findMany({
      where: { vendorProfileId },
      orderBy: { givenAt: 'desc' },
    });
  }

  /**
   * Get active consents for a vendor (not withdrawn)
   */
  async getActiveVendorConsents(vendorProfileId: string): Promise<VendorConsent[]> {
    return this.prisma.vendorConsent.findMany({
      where: {
        vendorProfileId,
        withdrawnAt: null,
      },
      orderBy: { givenAt: 'desc' },
    });
  }

  /**
   * Check if vendor has given a specific consent
   */
  async hasVendorConsent(
    vendorProfileId: string,
    consentType: ConsentType,
    version?: string,
  ): Promise<boolean> {
    const where: any = {
      vendorProfileId,
      consentType,
      withdrawnAt: null,
    };

    if (version) {
      where.version = version;
    }

    const consent = await this.prisma.vendorConsent.findFirst({ where });
    return !!consent;
  }

  /**
   * Get vendor consent status for all types
   */
  async getVendorConsentStatus(vendorProfileId: string): Promise<ConsentStatus[]> {
    const consents = await this.getActiveVendorConsents(vendorProfileId);
    const consentTypes = Object.values(ConsentType);

    return consentTypes.map((type) => {
      const consent = consents.find((c) => c.consentType === type);
      return {
        consentType: type,
        hasConsent: !!consent,
        version: consent?.version ?? undefined,
        givenAt: consent?.givenAt ?? undefined,
        withdrawnAt: consent?.withdrawnAt ?? undefined,
      };
    });
  }

  /**
   * Bulk record vendor consents (for onboarding)
   */
  async giveVendorConsentsBulk(
    vendorProfileId: string,
    consents: GiveConsentDto[],
  ): Promise<VendorConsent[]> {
    const results: VendorConsent[] = [];

    for (const dto of consents) {
      const consent = await this.giveVendorConsent(vendorProfileId, dto);
      results.push(consent);
    }

    return results;
  }

  // ============================================================================
  // REQUIRED CONSENTS CHECK
  // ============================================================================

  /**
   * Check if user has all required consents for using the platform
   */
  async hasRequiredUserConsents(userId: string): Promise<{
    hasAll: boolean;
    missing: ConsentType[];
  }> {
    const requiredTypes: ConsentType[] = [
      ConsentType.TERMS_OF_SERVICE,
      ConsentType.PRIVACY_POLICY,
    ];

    const missing: ConsentType[] = [];

    for (const type of requiredTypes) {
      const hasConsent = await this.hasUserConsent(userId, type);
      if (!hasConsent) {
        missing.push(type);
      }
    }

    return {
      hasAll: missing.length === 0,
      missing,
    };
  }

  /**
   * Check if vendor has all required consents for operating on platform
   */
  async hasRequiredVendorConsents(vendorProfileId: string): Promise<{
    hasAll: boolean;
    missing: ConsentType[];
  }> {
    const requiredTypes: ConsentType[] = [
      ConsentType.TERMS_OF_SERVICE,
      ConsentType.PRIVACY_POLICY,
      ConsentType.PLATFORM_COMMISSION,
      ConsentType.DATA_PROCESSING,
    ];

    const missing: ConsentType[] = [];

    for (const type of requiredTypes) {
      const hasConsent = await this.hasVendorConsent(vendorProfileId, type);
      if (!hasConsent) {
        missing.push(type);
      }
    }

    return {
      hasAll: missing.length === 0,
      missing,
    };
  }

  // ============================================================================
  // CONSENT DEFINITIONS
  // ============================================================================

  /**
   * Get all active consent definitions for users
   */
  async getUserConsentDefinitions(): Promise<ConsentDefinition[]> {
    return this.prisma.consentDefinition.findMany({
      where: {
        isActive: true,
        appliesToUsers: true,
        OR: [
          { effectiveUntil: null },
          { effectiveUntil: { gte: new Date() } },
        ],
      },
      orderBy: [{ isRequired: 'desc' }, { displayOrder: 'asc' }],
    });
  }

  /**
   * Get all active consent definitions for vendors
   */
  async getVendorConsentDefinitions(): Promise<ConsentDefinition[]> {
    return this.prisma.consentDefinition.findMany({
      where: {
        isActive: true,
        appliesToVendors: true,
        OR: [
          { effectiveUntil: null },
          { effectiveUntil: { gte: new Date() } },
        ],
      },
      orderBy: [{ isRequired: 'desc' }, { displayOrder: 'asc' }],
    });
  }

  /**
   * Get required consent definitions for users
   */
  async getRequiredUserConsentDefinitions(): Promise<ConsentDefinition[]> {
    return this.prisma.consentDefinition.findMany({
      where: {
        isActive: true,
        isRequired: true,
        appliesToUsers: true,
        OR: [
          { effectiveUntil: null },
          { effectiveUntil: { gte: new Date() } },
        ],
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Get required consent definitions for vendors
   */
  async getRequiredVendorConsentDefinitions(): Promise<ConsentDefinition[]> {
    return this.prisma.consentDefinition.findMany({
      where: {
        isActive: true,
        isRequired: true,
        appliesToVendors: true,
        OR: [
          { effectiveUntil: null },
          { effectiveUntil: { gte: new Date() } },
        ],
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Get optional consent definitions for users
   */
  async getOptionalUserConsentDefinitions(): Promise<ConsentDefinition[]> {
    return this.prisma.consentDefinition.findMany({
      where: {
        isActive: true,
        isRequired: false,
        appliesToUsers: true,
        OR: [
          { effectiveUntil: null },
          { effectiveUntil: { gte: new Date() } },
        ],
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Get a specific consent definition by type and version
   */
  async getConsentDefinition(
    consentType: ConsentType,
    version?: string,
  ): Promise<ConsentDefinition | null> {
    if (version) {
      return this.prisma.consentDefinition.findUnique({
        where: {
          consentType_version: { type: consentType, version },
        },
      });
    }

    // Get latest active version
    return this.prisma.consentDefinition.findFirst({
      where: {
        type: consentType,
        isActive: true,
        OR: [
          { effectiveUntil: null },
          { effectiveUntil: { gte: new Date() } },
        ],
      },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  /**
   * Get consent definition by ID
   */
  async getConsentDefinitionById(id: string): Promise<ConsentDefinition | null> {
    return this.prisma.consentDefinition.findUnique({
      where: { id },
    });
  }

  /**
   * Get all consent definitions (for admin)
   */
  async getAllConsentDefinitions(): Promise<ConsentDefinition[]> {
    return this.prisma.consentDefinition.findMany({
      orderBy: [{ type: 'asc' }, { version: 'desc' }],
    });
  }
}
