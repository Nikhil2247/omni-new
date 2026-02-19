// ============================================================================
// MESSAGE REPOSITORY - Messaging Domain
// ============================================================================

import { Injectable } from '@nestjs/common';
import { Prisma, Message } from '@prisma/client';
import {
  BaseRepository,
  PaginatedResult,
} from '../../../core/database/repositories/base.repository';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class MessagingMessageRepository extends BaseRepository<
  Message,
  Prisma.MessageCreateInput,
  Prisma.MessageUpdateInput,
  Prisma.MessageWhereInput,
  Prisma.MessageWhereUniqueInput,
  Prisma.MessageOrderByWithRelationInput
> {
  protected readonly modelName = 'Message';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.message;
  }

  async findByConversationId(
    conversationId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedResult<Message>> {
    return this.findManyPaginated(
      { page, limit },
      {
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
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
    );
  }
}
