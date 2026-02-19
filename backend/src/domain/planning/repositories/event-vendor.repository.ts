// ============================================================================
// EVENT VENDOR REPOSITORY - Planning Domain
// ============================================================================

import { Injectable } from '@nestjs/common';
import { Prisma, EventVendor, EventVendorStatus } from '@prisma/client';
import { BaseRepository } from '../../../core/database/repositories/base.repository';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class EventVendorRepository extends BaseRepository<
  EventVendor,
  Prisma.EventVendorCreateInput,
  Prisma.EventVendorUpdateInput,
  Prisma.EventVendorWhereInput,
  Prisma.EventVendorWhereUniqueInput,
  Prisma.EventVendorOrderByWithRelationInput
> {
  protected readonly modelName = 'EventVendor';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.eventVendor;
  }

  async findByEvent(eventId: string) {
    return this.model.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStatus(eventId: string, status: EventVendorStatus) {
    return this.model.findMany({
      where: { eventId, status },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTotalCost(eventId: string): Promise<number> {
    const result = await this.prisma.eventVendor.aggregate({
      where: { eventId },
      _sum: {
        contractAmount: true,
      },
    });

    return Number(result._sum.contractAmount || 0);
  }
}
