// ============================================================================
// BILLING REPOSITORY
// ============================================================================
// NOTE: VendorBilling model does not exist in Prisma schema
// This repository is disabled until the model is added
// ============================================================================

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma.service'
import { BaseRepository } from '../../../core/database/repositories/base.repository'
import {
  // VendorBilling, // Model doesn't exist
  Prisma,
  // PayoutStatus, // Enum doesn't exist
} from '@prisma/client'

@Injectable()
export class BillingRepository extends BaseRepository<
  any, // VendorBilling model doesn't exist
  any, // Prisma.VendorBillingCreateInput,
  any, // Prisma.VendorBillingUpdateInput,
  any, // Prisma.VendorBillingWhereInput,
  any, // Prisma.VendorBillingWhereUniqueInput,
  any  // Prisma.VendorBillingOrderByWithRelationInput
> {
  protected readonly modelName = 'VendorBilling'

  constructor(prisma: PrismaService) {
    super(prisma)
  }

  protected get model(): any {
    // return this.prisma.vendorBilling // Model doesn't exist
    throw new Error('VendorBilling model does not exist in schema')
  }

  async findByVendor(vendorProfileId: string, options?: { skip?: number; take?: number }) {
    return this.model.findMany({
      where: { vendorProfileId },
      include: {
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: options?.skip,
      take: options?.take,
    })
  }

  async findByStatus(status: any /* PayoutStatus */, options?: { skip?: number; take?: number }) {
    return this.model.findMany({
      where: { status },
      include: {
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      skip: options?.skip,
      take: options?.take,
    })
  }

  async getPendingPayouts() {
    return this.model.findMany({
      where: {
        status: {
          in: ['PENDING', 'PROCESSING'],
        },
      },
      include: {
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  async getTotalEarnings(vendorProfileId: string): Promise<number> {
    // Model VendorBilling does not exist - returning mock data
    const result: any = { _sum: { amount: 0 }, _count: { id: 0 } }
    return Number(result._sum.amount || 0)
  }

  async getPendingAmount(vendorProfileId: string): Promise<number> {
    // Model VendorBilling does not exist - returning mock data
    const result: any = { _sum: { amount: 0 }, _count: { id: 0 } }
    return Number(result._sum.amount || 0)
  }
}

