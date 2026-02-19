// ============================================================================
// ACTIVE EVENT REPOSITORY - Operations Domain
// ============================================================================

import { Injectable } from '@nestjs/common';
import { Prisma, ActiveEvent } from '@prisma/client';
import {
  BaseRepository,
  PaginatedResult,
} from '../../../core/database/repositories/base.repository';
import { PrismaService } from '../../../core/database/prisma.service';
import { SearchActiveEventsDto } from '../dto/active-event.dto';

@Injectable()
export class ActiveEventRepository extends BaseRepository<
  ActiveEvent,
  Prisma.ActiveEventCreateInput,
  Prisma.ActiveEventUpdateInput,
  Prisma.ActiveEventWhereInput,
  Prisma.ActiveEventWhereUniqueInput,
  Prisma.ActiveEventOrderByWithRelationInput
> {
  protected readonly modelName = 'ActiveEvent';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.activeEvent;
  }

  async findByOpsManager(opsManagerId: string): Promise<ActiveEvent[]> {
    return this.prisma.activeEvent.findMany({
      where: { opsManagerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStatus(status: string): Promise<ActiveEvent[]> {
    return this.prisma.activeEvent.findMany({
      where: { status: status as any },
      orderBy: { eventDate: 'asc' },
    });
  }

  async search(
    dto: SearchActiveEventsDto,
  ): Promise<PaginatedResult<ActiveEvent>> {
    const {
      status,
      origin,
      opsManagerId,
      clientName,
      page = 1,
      limit = 20,
    } = dto;

    const where: Prisma.ActiveEventWhereInput = {
      ...(status && { status: status as any }),
      ...(origin && { origin: origin as any }),
      ...(opsManagerId && { opsManagerId }),
      ...(clientName && {
        clientName: {
          contains: clientName,
          mode: 'insensitive',
        },
      }),
    };

    return this.findManyPaginated(
      { page, limit },
      {
        where,
        orderBy: { createdAt: 'desc' },
      },
    );
  }

  async findUpcoming(limit: number = 10): Promise<ActiveEvent[]> {
    return this.prisma.activeEvent.findMany({
      where: {
        eventDate: {
          gte: new Date(),
        },
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
      },
      orderBy: { eventDate: 'asc' },
      take: limit,
    });
  }

  async findByLeadId(leadId: string): Promise<ActiveEvent | null> {
    return this.prisma.activeEvent.findUnique({
      where: { convertedFromLeadId: leadId },
    });
  }
}
