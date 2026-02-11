// ============================================================================
// KYC VERIFICATION REPOSITORY
// ============================================================================

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma.service'
import { BaseRepository } from '../../../core/database/repositories/base.repository'
import {
  VendorKYC,
  Prisma,
  KYCStatus,
} from '@prisma/client'

@Injectable()
export class KycVerificationRepository extends BaseRepository<
  VendorKYC,
  Prisma.VendorKYCCreateInput,
  Prisma.VendorKYCUpdateInput,
  Prisma.VendorKYCWhereInput,
  Prisma.VendorKYCWhereUniqueInput,
  Prisma.VendorKYCOrderByWithRelationInput
> {
  protected readonly modelName = 'VendorKYC'

  constructor(prisma: PrismaService) {
    super(prisma)
  }

  protected get model() {
    return this.prisma.vendorKYC
  }

  async findByVendorProfileId(vendorProfileId: string): Promise<VendorKYC | null> {
    return this.model.findUnique({
      where: { vendorProfileId },
      include: {
        documents: true,
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
            contactEmail: true,
          },
        },
      },
    })
  }

  async findByStatus(status: KYCStatus, options?: { skip?: number; take?: number }) {
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
    })
  }

  async getPendingCount(): Promise<number> {
    return this.model.count({
      where: {
        status: {
          in: ['PENDING', 'SUBMITTED', 'UNDER_REVIEW'],
        },
      },
    })
  }

  async getExpiringSoon(daysThreshold: number = 30) {
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold)

    return this.model.findMany({
      where: {
        status: 'APPROVED',
        // verifiedAt: { // Field doesn't exist on VendorKYC
        //   lte: thresholdDate,
        // },
        createdAt: { // Use createdAt as proxy for verification date
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
    })
  }
}
