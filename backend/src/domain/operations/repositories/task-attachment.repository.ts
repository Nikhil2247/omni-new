// ============================================================================
// TASK ATTACHMENT REPOSITORY
// ============================================================================

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma.service'
import { BaseRepository } from '../../../core/database/repositories/base.repository'
import { TaskAttachment, Prisma } from '@prisma/client'

@Injectable()
export class TaskAttachmentRepository extends BaseRepository<
  TaskAttachment,
  Prisma.TaskAttachmentCreateInput,
  Prisma.TaskAttachmentUpdateInput,
  Prisma.TaskAttachmentWhereInput,
  Prisma.TaskAttachmentWhereUniqueInput,
  Prisma.TaskAttachmentOrderByWithRelationInput
> {
  protected readonly modelName = 'TaskAttachment'

  constructor(prisma: PrismaService) {
    super(prisma)
  }

  protected get model() {
    return this.prisma.taskAttachment
  }

  async findByTask(taskId: string) {
    return this.model.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    })
  }
}
