// ============================================================================
// KYC VERIFICATION REPOSITORY
// ============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base.repository';
import { VendorKYC, Prisma, KYCStatus } from '@prisma/client';

@Injectable()
export class KycVerificationRepository extends BaseRepository<
  VendorKYC,
  Prisma.VendorKYCCreateInput,
  Prisma.VendorKYCUpdateInput,
  Prisma.VendorKYCWhereInput,
  Prisma.VendorKYCWhereUniqueInput,
  Prisma.VendorKYCOrderByWithRelationInput
> {
  protected readonly modelName = 'VendorKYC';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.vendorKYC;
  }

  async findByVendorProfileId(
    vendorProfileId: string,
  ): Promise<VendorKYC | null> {
    return this.model.findUnique({
      where: { vendorProfileId },
      include: {
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
      },
    });
  }

  async findAll(options?: {
    status?: KYCStatus | KYCStatus[];
    skip?: number;
    take?: number;
    orderBy?: 'asc' | 'desc';
  }) {
    this.logger.log(`Repository findAll called with options: ${JSON.stringify(options)}`);

    const where: Prisma.VendorKYCWhereInput = {};

    if (options?.status) {
      if (Array.isArray(options.status)) {
        where.status = { in: options.status };
      } else {
        where.status = options.status;
      }
    }

    try {
      const results = await this.model.findMany({
        where,
        include: {
          documents: {
            orderBy: { createdAt: 'desc' },
          },
          vendorProfile: {
            select: {
              id: true,
              businessName: true,
              slug: true,
              contactEmail: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: options?.orderBy || 'desc' },
        skip: options?.skip,
        take: options?.take,
      });

      this.logger.log(`Repository findAll found ${results?.length ?? 0} records`);
      return results || [];
    } catch (error) {
      this.logger.error(`Repository findAll error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async countAll(status?: KYCStatus | KYCStatus[]): Promise<number> {
    const where: Prisma.VendorKYCWhereInput = {};

    if (status) {
      if (Array.isArray(status)) {
        where.status = { in: status };
      } else {
        where.status = status;
      }
    }

    return this.model.count({ where });
  }

  async findByStatus(
    status: KYCStatus,
    options?: { skip?: number; take?: number },
  ) {
    return this.model.findMany({
      where: { status },
      include: {
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
            contactEmail: true,
          },
        },
        documents: true,
      },
      orderBy: { submittedAt: 'asc' },
      skip: options?.skip,
      take: options?.take,
    });
  }

  async getPendingCount(): Promise<number> {
    return this.model.count({
      where: {
        status: {
          in: ['PENDING', 'SUBMITTED', 'UNDER_REVIEW'],
        },
      },
    });
  }

  async getExpiringSoon(daysThreshold: number = 30) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    return this.model.findMany({
      where: {
        status: 'APPROVED',
        // verifiedAt: { // Field doesn't exist on VendorKYC
        //   lte: thresholdDate,
        // },
        createdAt: {
          // Use createdAt as proxy for verification date
          lte: thresholdDate,
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
}
