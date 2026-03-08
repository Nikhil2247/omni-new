// ============================================================================
// REQUIREMENT SHEET REPOSITORY
// ============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base.repository';
import { RequirementSheet, Prisma, RequirementStatus } from '@prisma/client';

@Injectable()
export class RequirementSheetRepository extends BaseRepository<
  RequirementSheet,
  Prisma.RequirementSheetCreateInput,
  Prisma.RequirementSheetUpdateInput,
  Prisma.RequirementSheetWhereInput,
  Prisma.RequirementSheetWhereUniqueInput,
  Prisma.RequirementSheetOrderByWithRelationInput
> {
  protected readonly modelName = 'RequirementSheet';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.requirementSheet;
  }

  async findByActiveEvent(activeEventId: string) {
    return this.model.findUnique({
      where: { activeEventId },
      include: { items: true },
    });
  }

  async findByStatus(status: RequirementStatus) {
    return this.model.findMany({
      where: {
        items: {
          some: { status },
        },
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByApprovalToken(token: string) {
    return this.model.findUnique({
      where: { approvalToken: token },
      include: {
        items: true,
        activeEvent: {
          select: {
            id: true,
            clientName: true,
            eventType: true,
            eventDate: true,
            clientEmail: true,
            clientPhone: true,
          },
        },
      },
    });
  }
}
