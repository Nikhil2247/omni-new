// ============================================================================
// DISPUTE REPOSITORY
// ============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base.repository';
import { Dispute, Prisma, DisputeStatus, DisputeType } from '@prisma/client';

@Injectable()
export class DisputeRepository extends BaseRepository<
  Dispute,
  Prisma.DisputeCreateInput,
  Prisma.DisputeUpdateInput,
  Prisma.DisputeWhereInput,
  Prisma.DisputeWhereUniqueInput,
  Prisma.DisputeOrderByWithRelationInput
> {
  protected readonly modelName = 'Dispute';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get model(): any {
    return this.prisma.dispute;
  }

  async findByVendor(
    vendorProfileId: string,
    options?: { skip?: number; take?: number },
  ) {
    return this.model.findMany({
      where: { vendorProfileId },
      orderBy: { createdAt: 'desc' },
      skip: options?.skip,
      take: options?.take,
    });
  }

  async findByReporter(
    reporterId: string,
    options?: { skip?: number; take?: number },
  ) {
    return this.model.findMany({
      where: { reporterId },
      orderBy: { createdAt: 'desc' },
      skip: options?.skip,
      take: options?.take,
    });
  }

  async findByStatus(
    status: DisputeStatus,
    options?: { skip?: number; take?: number },
  ) {
    return this.model.findMany({
      where: { status },
      orderBy: { createdAt: 'asc' },
      skip: options?.skip,
      take: options?.take,
    });
  }

  async findByType(
    type: DisputeType,
    options?: { skip?: number; take?: number },
  ) {
    return this.model.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
      skip: options?.skip,
      take: options?.take,
    });
  }

  async getOpenDisputesCount(): Promise<number> {
    return this.model.count({
      where: {
        status: {
          in: ['OPEN', 'INVESTIGATING'],
        },
      },
    });
  }

  async search(
    filters: {
      vendorProfileId?: string;
      reporterId?: string;
      status?: DisputeStatus;
      type?: DisputeType;
    },
    options?: { skip?: number; take?: number },
  ) {
    return this.model.findMany({
      where: {
        ...filters,
      },
      orderBy: { createdAt: 'desc' },
      skip: options?.skip,
      take: options?.take,
    });
  }
}
