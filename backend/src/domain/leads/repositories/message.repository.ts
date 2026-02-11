// ============================================================================
// MESSAGE REPOSITORY - Leads Domain
// ============================================================================

import { Injectable } from '@nestjs/common'
import { Prisma, Message } from '@prisma/client'
import { BaseRepository, PaginatedResult } from '../../../core/database/repositories/base.repository'
import { PrismaService } from '../../../core/database/prisma.service'

@Injectable()
export class MessageRepository extends BaseRepository<
  Message,
  Prisma.MessageCreateInput,
  Prisma.MessageUpdateInput,
  Prisma.MessageWhereInput,
  Prisma.MessageWhereUniqueInput,
  Prisma.MessageOrderByWithRelationInput
> {
  protected readonly modelName = 'Message'

  constructor(prisma: PrismaService) {
    super(prisma)
  }

  protected get model() {
    return this.prisma.message
  }

  async findByLeadId(leadId: string, page: number = 1, limit: number = 50): Promise<PaginatedResult<Message>> {
    return this.findManyPaginated(
      { page, limit },
      {
        where: { leadId },
        orderBy: { createdAt: 'asc' },
      },
    )
  }

  async getUnreadCount(leadId: string, userId: string): Promise<number> {
    return this.prisma.message.count({
      where: {
        leadId,
        senderId: { not: userId },
        readAt: null,
      },
    })
  }

  async markAsRead(messageIds: string[]): Promise<void> {
    await this.prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    })
  }

  async getLatestMessage(leadId: string): Promise<Message | null> {
    return this.prisma.message.findFirst({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    })
  }
}
