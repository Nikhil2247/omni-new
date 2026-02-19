// ============================================================================
// OPERATIONAL TASK REPOSITORY
// ============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base.repository';
import { OperationalTask, Prisma, OperationalTaskStatus } from '@prisma/client';

@Injectable()
export class OperationalTaskRepository extends BaseRepository<
  OperationalTask,
  Prisma.OperationalTaskCreateInput,
  Prisma.OperationalTaskUpdateInput,
  Prisma.OperationalTaskWhereInput,
  Prisma.OperationalTaskWhereUniqueInput,
  Prisma.OperationalTaskOrderByWithRelationInput
> {
  protected readonly modelName = 'OperationalTask';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.operationalTask;
  }

  async findByActiveEvent(activeEventId: string) {
    return this.model.findMany({
      where: { activeEventId },
      include: { attachments: true },
      orderBy: { dueDate: 'asc' },
    });
  }

  async findByAssignee(userId?: string, vendorId?: string) {
    return this.model.findMany({
      where: {
        ...(userId ? { assignedToUserId: userId } : {}),
        ...(vendorId ? { assignedToVendorId: vendorId } : {}),
      },
      include: { attachments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStatus(status: OperationalTaskStatus) {
    return this.model.findMany({
      where: { status },
      include: { attachments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOverdueTasks() {
    return this.model.findMany({
      where: {
        dueDate: { lt: new Date() },
        status: { not: 'COMPLETED' },
      },
      include: { attachments: true },
      orderBy: { dueDate: 'asc' },
    });
  }
}
