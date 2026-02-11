// ============================================================================
// SERVICE REPOSITORY
// ============================================================================

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma.service'
import { BaseRepository } from '../../../core/database/repositories/base.repository'
import {
  Service,
  Prisma,
  PricingType,
} from '@prisma/client'

@Injectable()
export class ServiceRepository extends BaseRepository<
  Service,
  Prisma.ServiceCreateInput,
  Prisma.ServiceUpdateInput,
  Prisma.ServiceWhereInput,
  Prisma.ServiceWhereUniqueInput,
  Prisma.ServiceOrderByWithRelationInput
> {
  protected readonly modelName = 'Service'

  constructor(prisma: PrismaService) {
    super(prisma)
  }

  protected get model() {
    return this.prisma.service
  }

  async findByVendorProfile(vendorProfileId: string, includeInactive = false) {
    return this.model.findMany({
      where: {
        vendorProfileId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        pricingTiers: {
          orderBy: { sortOrder: 'asc' },
        },
        serviceType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async findByServiceType(serviceTypeId: string, options?: { skip?: number; take?: number }) {
    return this.model.findMany({
      where: {
        serviceTypeId,
        isActive: true,
      },
      include: {
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
            category: true,
            address: {
              include: {
                city: {
                  include: {
                    state: true,
                  },
                },
              },
            },
          },
        },
        pricingTiers: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      skip: options?.skip,
      take: options?.take,
    })
  }

  async findByPricingType(pricingType: PricingType, options?: { skip?: number; take?: number }) {
    return this.model.findMany({
      where: {
        pricingType,
        isActive: true,
      },
      include: {
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
          },
        },
        pricingTiers: true,
      },
      skip: options?.skip,
      take: options?.take,
    })
  }

  async findInPriceRange(minPrice: number, maxPrice: number, options?: { skip?: number; take?: number }) {
    return this.model.findMany({
      where: {
        isActive: true,
        OR: [
          {
            startingPrice: {
              gte: minPrice,
              lte: maxPrice,
            },
          },
          {
            pricingTiers: {
              some: {
                price: {
                  gte: minPrice,
                  lte: maxPrice,
                },
              },
            },
          },
        ],
      },
      include: {
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
            // avgRating: true, // Field doesn't exist on VendorProfile
          },
        },
        pricingTiers: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      skip: options?.skip,
      take: options?.take,
    })
  }
}
