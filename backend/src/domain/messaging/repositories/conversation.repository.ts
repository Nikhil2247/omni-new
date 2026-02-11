// ============================================================================
// CONVERSATION REPOSITORY - Messaging Domain
// ============================================================================

import { Injectable } from '@nestjs/common'
import { Prisma, Conversation } from '@prisma/client'
import { BaseRepository, PaginatedResult } from '../../../core/database/repositories/base.repository'
import { PrismaService } from '../../../core/database/prisma.service'

@Injectable()
export class ConversationRepository extends BaseRepository<
  Conversation,
  Prisma.ConversationCreateInput,
  Prisma.ConversationUpdateInput,
  Prisma.ConversationWhereInput,
  Prisma.ConversationWhereUniqueInput,
  Prisma.ConversationOrderByWithRelationInput
> {
  protected readonly modelName = 'Conversation'

  constructor(prisma: PrismaService) {
    super(prisma)
  }

  protected get model() {
    return this.prisma.conversation
  }

  async findDirectConversationByUsers(userId: string, otherUserId: string): Promise<Conversation | null> {
    return this.prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        leadId: null,
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
    })
  }

  async findByLeadId(leadId: string): Promise<Conversation | null> {
    return this.prisma.conversation.findFirst({
      where: { leadId },
    })
  }

  async findUserConversations(userId: string, page: number, limit: number): Promise<PaginatedResult<Conversation>> {
    return this.findManyPaginated(
      { page, limit },
      {
        where: {
          participants: { some: { userId } },
        },
        orderBy: [
          { lastMessageAt: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatarUrl: true,
                  vendorProfile: {
                    select: {
                      id: true,
                      slug: true,
                      businessName: true,
                      profilePhotoUrl: true,
                    },
                  },
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              attachments: true,
              reactions: true,
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      },
    )
  }
}
