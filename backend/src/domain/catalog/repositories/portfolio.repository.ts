// ============================================================================
// PORTFOLIO REPOSITORY
// ============================================================================

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma.service'
import { BaseRepository } from '../../../core/database/repositories/base.repository'
import {
  Portfolio,
  Prisma,
} from '@prisma/client'

@Injectable()
export class PortfolioRepository extends BaseRepository<
  Portfolio,
  Prisma.PortfolioCreateInput,
  Prisma.PortfolioUpdateInput,
  Prisma.PortfolioWhereInput,
  Prisma.PortfolioWhereUniqueInput,
  Prisma.PortfolioOrderByWithRelationInput
> {
  protected readonly modelName = 'Portfolio'

  constructor(prisma: PrismaService) {
    super(prisma)
  }

  protected get model() {
    return this.prisma.portfolio
  }

  async findByVendorProfile(vendorProfileId: string) {
    return this.model.findMany({
      where: { vendorProfileId },
      include: {
        mediaItems: {
          where: { isApproved: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async findFeatured(vendorProfileId: string) {
    return this.model.findMany({
      where: {
        vendorProfileId,
        isFeatured: true,
      },
      include: {
        mediaItems: {
          where: { isApproved: true },
          orderBy: { sortOrder: 'asc' },
          take: 5,
        },
      },
      orderBy: { sortOrder: 'asc' },
    })
  }

  async findWithMediaCount(vendorProfileId: string) {
    const portfolios = await this.model.findMany({
      where: { vendorProfileId },
      include: {
        _count: {
          select: {
            mediaItems: {
              where: { isApproved: true },
            },
          },
        },
        mediaItems: {
          where: { isApproved: true },
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return portfolios
  }
}
