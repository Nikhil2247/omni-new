// ============================================================================
// LEAD REPOSITORY - Leads Domain
// ============================================================================

import { Injectable } from '@nestjs/common'
import { Prisma, Lead } from '@prisma/client'
import { BaseRepository, PaginatedResult } from '../../../core/database/repositories/base.repository'
import { PrismaService } from '../../../core/database/prisma.service'
import { SearchLeadsDto } from '../dto/lead.dto'

@Injectable()
export class LeadRepository extends BaseRepository<
  Lead,
  Prisma.LeadCreateInput,
  Prisma.LeadUpdateInput,
  Prisma.LeadWhereInput,
  Prisma.LeadWhereUniqueInput,
  Prisma.LeadOrderByWithRelationInput
> {
  protected readonly modelName = 'Lead'

  constructor(prisma: PrismaService) {
    super(prisma)
  }

  protected get model() {
    return this.prisma.lead
  }

  async findByVendorProfile(vendorProfileId: string, status?: string): Promise<Lead[]> {
    return this.prisma.lead.findMany({
      where: {
        vendorProfileId,
        ...(status && { status: status as any }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        planner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })
  }

  async findByPlanner(plannerId: string): Promise<Lead[]> {
    return this.prisma.lead.findMany({
      where: { plannerId },
      orderBy: { createdAt: 'desc' },
      include: {
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
            slug: true,
          },
        },
      },
    })
  }

  async search(dto: SearchLeadsDto): Promise<PaginatedResult<Lead>> {
    const { vendorProfileId, plannerId, status, source, page = 1, limit = 20 } = dto

    const where: Prisma.LeadWhereInput = {
      ...(vendorProfileId && { vendorProfileId }),
      ...(plannerId && { plannerId }),
      ...(status && { status: status as any }),
      ...(source && { source: source as any }),
    }

    return this.findManyPaginated(
      { page, limit },
      {
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          vendorProfile: {
            select: {
              id: true,
              businessName: true,
              slug: true,
            },
          },
          planner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    )
  }

  async getUnreadCount(vendorProfileId: string): Promise<number> {
    return this.prisma.lead.count({
      where: {
        vendorProfileId,
        status: 'NEW',
      },
    })
  }
}
