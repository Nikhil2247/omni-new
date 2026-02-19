// ============================================================================
// GUEST UPLOAD REPOSITORY - Planning Domain
// ============================================================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { BaseRepository } from '../../../core/database/repositories/base.repository';
import { GuestUpload, Prisma, UploadStatus } from '@prisma/client';

@Injectable()
export class GuestUploadRepository extends BaseRepository<
  GuestUpload,
  Prisma.GuestUploadCreateInput,
  Prisma.GuestUploadUpdateInput,
  Prisma.GuestUploadWhereInput,
  Prisma.GuestUploadWhereUniqueInput,
  Prisma.GuestUploadOrderByWithRelationInput
> {
  protected readonly modelName = 'GuestUpload';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.guestUpload;
  }

  async findByMemory(eventMemoryId: string, status?: UploadStatus) {
    return this.model.findMany({
      where: {
        eventMemoryId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findApproved(eventMemoryId: string) {
    return this.model.findMany({
      where: {
        eventMemoryId,
        status: 'APPROVED',
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countPending(eventMemoryId: string) {
    return this.model.count({
      where: {
        eventMemoryId,
        status: 'PENDING',
      },
    });
  }

  async approve(id: string) {
    return this.model.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    });
  }

  async reject(id: string) {
    return this.model.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
      },
    });
  }
}
